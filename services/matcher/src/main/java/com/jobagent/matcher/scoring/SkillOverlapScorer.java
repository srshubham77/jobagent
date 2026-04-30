package com.jobagent.matcher.scoring;

import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Scores how much of the JD's required skills the candidate's profile covers.
 * Score = coverage * 100, capped at 100.
 * Coverage = |profile ∩ jd| / max(1, |jd skills|).
 * Bonuses for covering the primary stack (tags) vs. JD body keywords.
 */
@Component
public class SkillOverlapScorer {

    private static final Pattern WORD_BOUNDARY = Pattern.compile("\\b([A-Za-z][A-Za-z0-9+#.\\-]{1,30})\\b");
    private static final Pattern HTML_ENTITY   = Pattern.compile("&#?[a-zA-Z0-9]+;");

    // Common tech stop-words to ignore during JD keyword extraction
    private static final Set<String> STOP_WORDS = Set.of(
            // Generic English
            "the", "and", "for", "with", "our", "you", "will", "team", "join",
            "experience", "ability", "strong", "good", "great", "work", "use",
            "using", "build", "building", "remote", "salary", "company", "role",
            "job", "position", "we", "are", "looking", "candidate", "plus",
            "bonus", "preferred", "required", "must", "have", "years", "full",
            "stack", "based", "about", "help", "seeking", "apply", "skills",
            "from", "that", "this", "your", "their", "them", "they", "what",
            "how", "can", "make", "also", "like", "well", "new", "high",
            "level", "time", "cross", "driven", "focused", "oriented", "first",
            // US/global cities and states that appear in HN posts
            "san", "francisco", "york", "angeles", "chicago", "austin", "seattle",
            "boston", "denver", "atlanta", "toronto", "london", "berlin", "amsterdam",
            "singapore", "sydney", "bangalore", "mumbai", "hyderabad",
            // US state abbreviations (already filtered by min-length 4, kept for safety)
            "ohio", "utah", "iowa"
    );

    public record Result(int score, List<String> matched, List<String> missing) {}

    /**
     * @param profileSkills  skills from the candidate's profile
     * @param jdTags         source-provided tags (high signal — treat as required)
     * @param jdBody         full JD text (lower signal — secondary extraction)
     */
    public Result score(List<String> profileSkills, List<String> jdTags, String jdBody) {
        // Expand multi-word skills into individual tokens so "Spring Boot" matches "spring" or "boot" in JD body
        Set<String> profile = expandSkills(profileSkills);
        Set<String> primary  = normalize(jdTags);
        Set<String> bodyKeywords = extractKeywords(jdBody);

        if (primary.isEmpty() && bodyKeywords.isEmpty()) {
            return new Result(50, List.of(), List.of()); // no signal → neutral
        }

        int coverage;
        List<String> matched;
        List<String> missing;

        if (!primary.isEmpty()) {
            // Structured tags available (RemoteOK-style): measure how much of the required tags the profile covers
            Set<String> secondary = new HashSet<>(bodyKeywords);
            secondary.removeAll(primary);

            List<String> jdAll = new ArrayList<>();
            jdAll.addAll(primary);
            jdAll.addAll(primary); // double weight
            jdAll.addAll(secondary);

            long hits = jdAll.stream().filter(profile::contains).count();
            coverage = (int) Math.min(100, Math.round((double) hits / jdAll.size() * 100 * 1.5));
            matched  = primary.stream().filter(profile::contains).sorted().toList();
            missing  = primary.stream().filter(s -> !profile.contains(s)).sorted().toList();
        } else {
            // No structured tags (HN-style free text): measure how many profile skills appear in the JD body.
            // Score = (matches / 5) * 100, capped at 100. Five matching skills = full score.
            long hits = profile.stream().filter(bodyKeywords::contains).count();
            coverage = (int) Math.min(100, hits * 20);
            matched  = profile.stream().filter(bodyKeywords::contains).sorted().toList();
            missing  = List.of(); // can't determine required skills from free text
        }

        return new Result(coverage, matched, missing);
    }

    /** Normalize profile skills and also expand multi-word entries into individual tokens. */
    private Set<String> expandSkills(Collection<String> items) {
        if (items == null) return new HashSet<>();
        Set<String> result = new HashSet<>();
        for (String item : items) {
            if (item == null) continue;
            String lower = item.toLowerCase().trim();
            result.add(lower);
            // Also add individual words so "Spring Boot" matches "spring" or "boot" in JD body
            for (String word : lower.split("[\\s/+&()]+")) {
                if (word.length() >= 3) result.add(word);
            }
        }
        return result;
    }

    private Set<String> normalize(Collection<String> items) {
        if (items == null) return new HashSet<>();
        return items.stream()
                .filter(Objects::nonNull)
                .map(s -> s.toLowerCase().trim())
                .collect(Collectors.toCollection(HashSet::new));
    }

    private Set<String> extractKeywords(String text) {
        if (text == null || text.isBlank()) return new HashSet<>();
        // Strip HTML entities before tokenising
        String clean = HTML_ENTITY.matcher(text).replaceAll(" ");
        Set<String> result = new HashSet<>();
        var m = WORD_BOUNDARY.matcher(clean);
        while (m.find()) {
            String w = m.group(1).toLowerCase();
            if (w.length() >= 4 && !STOP_WORDS.contains(w) && !w.matches("\\d+")) {
                result.add(w);
            }
        }
        return result;
    }
}
