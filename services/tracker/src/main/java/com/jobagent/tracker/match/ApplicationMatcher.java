package com.jobagent.tracker.match;

import com.jobagent.tracker.domain.Application;
import com.jobagent.tracker.domain.Job;
import com.jobagent.tracker.repository.ApplicationRepository;
import com.jobagent.tracker.repository.JobRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Matches an inbound email to a submitted application.
 *
 * Strategy (in order):
 * 1. Sender email domain matches the company's apply-URL domain.
 * 2. Company name appears in the subject or snippet (case-insensitive, normalized).
 *
 * Returns empty if no confident match is found so the caller can route to the review queue.
 */
@Component
public class ApplicationMatcher {

    private static final Logger log = LoggerFactory.getLogger(ApplicationMatcher.class);
    private static final Pattern EMAIL_DOMAIN = Pattern.compile("@([\\w.-]+)$");

    private final ApplicationRepository applicationRepo;
    private final JobRepository jobRepo;

    public ApplicationMatcher(ApplicationRepository applicationRepo, JobRepository jobRepo) {
        this.applicationRepo = applicationRepo;
        this.jobRepo = jobRepo;
    }

    public Optional<UUID> match(UUID userId, String sender, String subject, String snippet) {
        List<Application> candidates = applicationRepo.findActiveForUser(userId);
        if (candidates.isEmpty()) return Optional.empty();

        String senderDomain = extractDomain(sender);

        for (Application app : candidates) {
            Job job = jobRepo.findById(app.getJobId()).orElse(null);
            if (job == null) continue;

            // Strategy 1: domain match
            if (senderDomain != null) {
                String companyDomain = extractDomain(job.getApplyUrl());
                if (companyDomain != null && senderDomain.endsWith(companyDomain)) {
                    log.debug("Domain match: applicationId={} senderDomain={}", app.getId(), senderDomain);
                    return Optional.of(app.getId());
                }
            }

            // Strategy 2: company name in subject or snippet
            String company = job.getCompany();
            if (company != null) {
                String companyNorm = normalize(company);
                if (contains(subject, companyNorm) || contains(snippet, companyNorm)) {
                    log.debug("Company name match: applicationId={} company={}", app.getId(), company);
                    return Optional.of(app.getId());
                }
            }
        }

        return Optional.empty();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    static String extractDomain(String value) {
        if (value == null) return null;

        // For email address: take part after @
        Matcher m = EMAIL_DOMAIN.matcher(value.trim());
        if (m.find()) {
            return rootDomain(m.group(1));
        }

        // For URL: take the host
        try {
            java.net.URI uri = new java.net.URI(value.trim());
            String host = uri.getHost();
            return host != null ? rootDomain(host) : null;
        } catch (Exception e) {
            return null;
        }
    }

    // "boards.greenhouse.io" → "greenhouse.io"; "stripe.com" → "stripe.com"
    static String rootDomain(String host) {
        if (host == null) return null;
        String[] parts = host.split("\\.");
        if (parts.length < 2) return host.toLowerCase();
        return (parts[parts.length - 2] + "." + parts[parts.length - 1]).toLowerCase();
    }

    static boolean contains(String text, String term) {
        if (text == null || term == null || term.isBlank()) return false;
        return normalize(text).contains(term);
    }

    static String normalize(String s) {
        return s == null ? "" : s.toLowerCase().replaceAll("[^a-z0-9]", " ").replaceAll("\\s+", " ").strip();
    }
}
