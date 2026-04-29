package com.jobagent.matcher.web;

import com.jobagent.matcher.domain.JobFitScore;
import com.jobagent.matcher.repository.JobFitScoreRepository;
import com.jobagent.matcher.repository.ProfileRepository;
import com.jobagent.matcher.service.MatcherService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/match")
public class MatcherController {

    private final MatcherService matcherService;
    private final JobFitScoreRepository fitScoreRepository;
    private final ProfileRepository profileRepository;

    public MatcherController(MatcherService matcherService,
                             JobFitScoreRepository fitScoreRepository,
                             ProfileRepository profileRepository) {
        this.matcherService = matcherService;
        this.fitScoreRepository = fitScoreRepository;
        this.profileRepository = profileRepository;
    }

    /** Trigger a full scoring pass for the calling user. */
    @PostMapping("/trigger")
    public ResponseEntity<Map<String, Object>> trigger(
            @RequestHeader("X-User-Id") UUID userId) {
        int count = matcherService.scoreForUser(userId);
        return ResponseEntity.ok(Map.of("scored", count));
    }

    /** Score a specific job on demand. */
    @PostMapping("/jobs/{jobId}")
    public ResponseEntity<JobFitScore> scoreJob(
            @RequestHeader("X-User-Id") UUID userId,
            @PathVariable UUID jobId) {
        return ResponseEntity.ok(matcherService.scoreJob(userId, jobId));
    }

    /** Return all fit scores for the user's current profile, sorted best-first. */
    @GetMapping("/scores")
    public ResponseEntity<List<JobFitScore>> scores(
            @RequestHeader("X-User-Id") UUID userId) {
        var profile = profileRepository.findByUserIdAndIsCurrentTrue(userId)
                .orElseThrow(() -> new NoSuchElementException("No profile for user " + userId));
        return ResponseEntity.ok(fitScoreRepository.findByProfileIdOrderByScoreDesc(profile.getId()));
    }
}
