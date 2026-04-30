package com.jobagent.matcher.scoring;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.temporal.ChronoField;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Estimates candidate seniority level from profile experience,
 * then compares against the level implied by the JD title and body.
 *
 * Levels (0-4): junior=0, mid=1, senior=2, staff=3, principal/vp=4
 * Score: exact match=100, one off=75, two off=50, three+ off=20
 */
@Component
public class SeniorityScorer {

    private static final Pattern YEAR_ONLY = Pattern.compile("^(\\d{4})$");
    private static final Pattern YEAR_MONTH = Pattern.compile("(\\d{4})-(\\d{2})");

    private static final List<String> LEVEL_KEYWORDS = List.of(
            "junior|jr|entry.?level|associate",           // 0
            "mid.?level|intermediate",                     // 1
            "senior|sr",                                   // 2
            "staff|lead|principal|architect",              // 3
            "principal|distinguished|fellow|vp|director"  // 4
    );

    public record Result(int score, String gap) {}

    public Result score(List<Map<String, Object>> experience, String jdTitle, String jdBody) {
        int candidateLevel = inferCandidateLevel(experience);
        int jdLevel        = inferJdLevel(jdTitle, jdBody);
        return scoreGap(candidateLevel, jdLevel);
    }

    private int inferCandidateLevel(List<Map<String, Object>> experience) {
        if (experience == null || experience.isEmpty()) return 1; // assume mid if unknown

        // Total years across all roles
        int totalMonths = experience.stream()
                .mapToInt(this::durationMonths)
                .sum();
        int years = totalMonths / 12;

        // Also look at most-recent title for seniority keywords
        String recentTitle = (String) experience.get(0).getOrDefault("title", "");
        int titleLevel = levelFromKeywords(recentTitle);

        // Use the higher of experience-derived and title-derived level
        int expLevel;
        if (years < 2)       expLevel = 0;
        else if (years < 5)  expLevel = 1;
        else if (years < 9)  expLevel = 2;
        else if (years < 13) expLevel = 3;
        else                 expLevel = 4;

        return Math.max(expLevel, titleLevel);
    }

    private int inferJdLevel(String title, String body) {
        int fromTitle = levelFromKeywords(title);
        if (fromTitle >= 0) return fromTitle;
        int fromBody = levelFromKeywords(body != null ? body.substring(0, Math.min(500, body.length())) : "");
        return fromBody >= 0 ? fromBody : 2; // default to senior if no signal
    }

    private int levelFromKeywords(String text) {
        if (text == null) return -1;
        String lower = text.toLowerCase();
        // Iterate from highest level down — "principal" matches before "senior"
        for (int i = LEVEL_KEYWORDS.size() - 1; i >= 0; i--) {
            if (lower.matches(".*(" + LEVEL_KEYWORDS.get(i) + ").*")) return i;
        }
        return -1;
    }

    private Result scoreGap(int candidate, int jd) {
        int gap = candidate - jd; // positive = overleveled, negative = underleveled
        int score;
        if (gap <= 0) {
            // Underleveled: candidate is below JD requirement — penalize
            score = switch (-gap) {
                case 0  -> 100;
                case 1  -> 75;
                case 2  -> 50;
                default -> 20;
            };
        } else {
            // Overleveled: senior applying to SE/Backend role is normal — minimal penalty
            score = switch (gap) {
                case 1  -> 100;
                case 2  -> 85;
                default -> 70;
            };
        }
        String gapNote = gap == 0 ? null
                : gap < 0 ? "underleveled by " + (-gap)
                : "overleveled by " + gap;
        return new Result(score, gapNote);
    }

    private int durationMonths(Map<String, Object> exp) {
        String start = (String) exp.get("startDate");
        String end   = (String) exp.get("endDate");
        if (start == null) return 0;

        int startMonth = parseToMonths(start);
        int endMonth   = (end == null || end.isBlank() || end.equalsIgnoreCase("present"))
                ? currentMonths()
                : parseToMonths(end);

        return Math.max(0, endMonth - startMonth);
    }

    private int parseToMonths(String dateStr) {
        if (dateStr == null) return 0;
        dateStr = dateStr.trim();
        var m = YEAR_ONLY.matcher(dateStr);
        if (m.matches()) return Integer.parseInt(m.group(1)) * 12;
        m = YEAR_MONTH.matcher(dateStr);
        if (m.find()) return Integer.parseInt(m.group(1)) * 12 + Integer.parseInt(m.group(2));
        // Try full date
        try {
            DateTimeFormatter fmt = new DateTimeFormatterBuilder()
                    .appendPattern("yyyy-MM")
                    .optionalStart().appendPattern("-dd").optionalEnd()
                    .parseDefaulting(ChronoField.DAY_OF_MONTH, 1)
                    .toFormatter();
            LocalDate d = LocalDate.parse(dateStr.substring(0, Math.min(7, dateStr.length())), fmt);
            return d.getYear() * 12 + d.getMonthValue();
        } catch (Exception e) {
            return 0;
        }
    }

    private int currentMonths() {
        LocalDate now = LocalDate.now();
        return now.getYear() * 12 + now.getMonthValue();
    }
}
