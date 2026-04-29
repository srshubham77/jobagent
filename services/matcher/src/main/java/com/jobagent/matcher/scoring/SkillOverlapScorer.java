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

    // Common tech stop-words to ignore during JD keyword extraction
    private static final Set<String> STOP_WORDS = Set.of(
            "the", "and", "for", "with", "our", "you", "will", "team", "join",
            "experience", "ability", "strong", "good", "great", "work", "use",
            "using", "build", "building", "remote", "salary", "company", "role",
            "job", "position", "we", "are", "looking", "candidate", "plus",
            "bonus", "preferred", "required", "must", "have", "years"
    );

    public record Result(int score, List<String> matched, List<String> missing) {}

    /**
     * @param profileSkills  skills from the candidate's profile
     * @param jdTags         source-provided tags (high signal — treat as required)
     * @param jdBody         full JD text (lower signal — secondary extraction)
     */
    public Result score(List<String> profileSkills, List<String> jdTags, String jdBody) {
        Set<String> profile = normalize(profileSkills);

        // Tags are weighted 2× — treat each tag as appearing twice
        Set<String> primary = normalize(jdTags);
        Set<String> secondary = extractKeywords(jdBody);
        secondary.removeAll(primary); // avoid double-counting

        // Build weighted jd skill set: primary counts double
        List<String> jdAll = new ArrayList<>();
        jdAll.addAll(primary);
        jdAll.addAll(primary); // double weight
        jdAll.addAll(secondary);

        if (jdAll.isEmpty()) return new Result(50, List.of(), List.of()); // no signal → neutral

        long hits = jdAll.stream().filter(profile::contains).count();
        int coverage = (int) Math.min(100, Math.round((double) hits / jdAll.size() * 100 * 1.5));

        List<String> matched = primary.stream().filter(profile::contains).sorted().toList();
        List<String> missing = primary.stream().filter(s -> !profile.contains(s)).sorted().toList();

        return new Result(coverage, matched, missing);
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
        Set<String> result = new HashSet<>();
        var m = WORD_BOUNDARY.matcher(text);
        while (m.find()) {
            String w = m.group(1).toLowerCase();
            if (w.length() >= 2 && !STOP_WORDS.contains(w) && !w.matches("\\d+")) {
                result.add(w);
            }
        }
        return result;
    }
}
