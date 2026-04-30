package com.jobagent.matcher.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobagent.matcher.config.MatcherProperties;
import com.jobagent.matcher.domain.*;
import com.jobagent.matcher.repository.*;
import com.jobagent.matcher.web.dto.JobFeedItem;
import com.jobagent.matcher.scoring.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class MatcherService {

    private static final Logger log = LoggerFactory.getLogger(MatcherService.class);

    private final MatcherProperties props;
    private final JobRepository jobRepository;
    private final ProfileRepository profileRepository;
    private final UserPreferencesRepository prefsRepository;
    private final JobFitScoreRepository fitScoreRepository;
    private final SkillOverlapScorer skillScorer;
    private final SeniorityScorer seniorityScorer;
    private final SalaryFitScorer salaryScorer;
    private final RecencyScorer recencyScorer;
    private final LlmFitScorer llmScorer;
    private final ObjectMapper mapper;

    public MatcherService(MatcherProperties props,
                          JobRepository jobRepository,
                          ProfileRepository profileRepository,
                          UserPreferencesRepository prefsRepository,
                          JobFitScoreRepository fitScoreRepository,
                          SkillOverlapScorer skillScorer,
                          SeniorityScorer seniorityScorer,
                          SalaryFitScorer salaryScorer,
                          RecencyScorer recencyScorer,
                          LlmFitScorer llmScorer,
                          ObjectMapper mapper) {
        this.props = props;
        this.jobRepository = jobRepository;
        this.profileRepository = profileRepository;
        this.prefsRepository = prefsRepository;
        this.fitScoreRepository = fitScoreRepository;
        this.skillScorer = skillScorer;
        this.seniorityScorer = seniorityScorer;
        this.salaryScorer = salaryScorer;
        this.recencyScorer = recencyScorer;
        this.llmScorer = llmScorer;
        this.mapper = mapper;
    }

    @Scheduled(fixedDelayString = "${matcher.scoring-delay-ms:60000}")
    public void scoreNewJobs() {
        // In a real multi-user system this would iterate all active users.
        // For Phase 1 (single user) we rely on explicit trigger or HTTP call.
        log.debug("Scheduled scoring pass — use /match/trigger for explicit run");
    }

    /**
     * Score all unscored jobs for a specific user. Returns the count of new scores written.
     */
    @Transactional
    public int scoreForUser(UUID userId) {
        Profile profile = profileRepository.findByUserIdAndIsCurrentTrue(userId)
                .orElseThrow(() -> new NoSuchElementException("No current profile for user " + userId));

        UserPreferences prefs = prefsRepository.findByUserId(userId).orElse(null);
        Integer minSalary = prefs != null ? prefs.getMinSalary() : null;

        List<Job> jobs = jobRepository.findUnscoredForProfile(profile.getId(), props.batchSize());
        if (jobs.isEmpty()) {
            log.info("No unscored jobs for user={}", userId);
            return 0;
        }

        int scored = 0;
        for (Job job : jobs) {
            fitScoreRepository.save(computeScore(job, profile, minSalary));
            scored++;
        }
        log.info("Scored {} jobs for user={}", scored, userId);
        return scored;
    }

    /**
     * Score a single specific job for a user (on-demand from the apply flow).
     */
    @Transactional
    public JobFitScore scoreJob(UUID userId, UUID jobId) {
        Profile profile = profileRepository.findByUserIdAndIsCurrentTrue(userId)
                .orElseThrow(() -> new NoSuchElementException("No current profile for user " + userId));
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new NoSuchElementException("Job not found: " + jobId));
        UserPreferences prefs = prefsRepository.findByUserId(userId).orElse(null);

        return fitScoreRepository.save(computeScore(job, profile, prefs != null ? prefs.getMinSalary() : null));
    }

    private JobFitScore computeScore(Job job, Profile profile, Integer minSalary) {
        // No structured tag column yet — pass empty so SkillOverlapScorer uses the body-based path.
        // Title-derived pseudo-tags caused false negatives (role nouns treated as required tech skills).
        List<String> jdTags = List.of();

        // Run scorers
        var skillResult = skillScorer.score(profile.getSkills(), jdTags, job.getJdBody());
        var seniorityResult = seniorityScorer.score(profile.getExperience(), job.getTitle(), job.getJdBody());
        var salaryResult = salaryScorer.score(job.getSalaryMode(), job.getSalaryMinUsd(),
                job.getSalaryMaxUsd(), minSalary);
        int recency = recencyScorer.score(job.getPostedAt());

        // Weighted composite (0-100)
        var w = props.weights();
        int composite = (int) Math.round(
                skillResult.score()         * w.skillOverlap() +
                seniorityResult.score()     * w.seniority() +
                salaryResult.score()        * w.salaryFit() +
                recency                     * w.recency()
        );

        // Optional LLM enrichment
        LlmFitScorer.LlmResult llm = null;
        if (props.llmEnabled() && composite >= props.llmScoreThreshold()) {
            llm = llmScorer.score(job, profile);
        }

        // Build breakdown map for JSONB storage
        Map<String, Object> breakdown = new LinkedHashMap<>();
        breakdown.put("skill_overlap",    skillResult.score());
        breakdown.put("seniority_match",  seniorityResult.score());
        breakdown.put("salary_fit",       salaryResult.score());
        breakdown.put("recency",          recency);
        breakdown.put("skills_matched",   skillResult.matched());
        breakdown.put("skills_missing",   skillResult.missing());
        if (seniorityResult.gap() != null)   breakdown.put("seniority_gap", seniorityResult.gap());
        if (salaryResult.note() != null)     breakdown.put("salary_note",   salaryResult.note());
        if (llm != null) {
            breakdown.put("llm_score",     llm.score());
            breakdown.put("llm_rationale", llm.rationale());
            breakdown.put("llm_key_gaps",  llm.keyGaps());
        }

        var score = new JobFitScore();
        score.setJobId(job.getId());
        score.setProfileId(profile.getId());
        score.setScore(composite);
        score.setSkillOverlap(skillResult.score());
        score.setSeniorityMatch(seniorityResult.score());
        score.setSalaryFit(salaryResult.score());
        score.setBreakdown(breakdown);
        return score;
    }

    public List<JobFeedItem> getFeed(UUID userId) {
        Profile profile = profileRepository.findByUserIdAndIsCurrentTrue(userId)
                .orElseThrow(() -> new NoSuchElementException("No current profile for user " + userId));

        return fitScoreRepository.findByProfileIdOrderByScoreDesc(profile.getId()).stream()
                .map(score -> jobRepository.findById(score.getJobId())
                        .map(job -> new JobFeedItem(
                                score.getId(),
                                job.getId(),
                                job.getTitle(),
                                job.getCompany(),
                                job.getLocation(),
                                job.isRemote(),
                                job.getSource(),
                                job.getSalaryMode(),
                                job.getSalaryMinUsd(),
                                job.getSalaryMaxUsd(),
                                job.getSalaryRaw(),
                                job.getApplyUrl(),
                                job.getTier(),
                                job.getPostedAt(),
                                score.getScore(),
                                score.getSkillOverlap(),
                                score.getSeniorityMatch(),
                                score.getSalaryFit(),
                                score.getBreakdown()
                        ))
                        .orElse(null))
                .filter(Objects::nonNull)
                .toList();
    }

    private List<String> extractTagsFromTitle(String title) {
        if (title == null) return List.of();
        // Derive rough technology signals from the role title
        return Arrays.stream(title.split("[\\s,/+&]+"))
                .map(String::toLowerCase)
                .filter(w -> w.length() >= 2)
                .filter(w -> !w.matches("(?:engineer|developer|lead|senior|staff|principal|junior|mid)"))
                .toList();
    }
}
