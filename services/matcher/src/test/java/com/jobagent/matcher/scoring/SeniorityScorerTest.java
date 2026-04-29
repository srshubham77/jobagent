package com.jobagent.matcher.scoring;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class SeniorityScorerTest {

    private final SeniorityScorer scorer = new SeniorityScorer();

    private Map<String, Object> exp(String title, String start, String end) {
        return Map.of("title", title, "startDate", start, "endDate", end != null ? end : "present");
    }

    @Test
    void seniorCandidateMatchesSeniorJd() {
        // ~6 years → senior level; matches "Senior Software Engineer" JD
        var exp = List.of(
                exp("Senior Backend Engineer", "2020-01", "2026-04"),
                exp("Backend Engineer",        "2022-06", "2020-01")  // earlier role, shorter
        );
        var result = scorer.score(exp, "Senior Software Engineer", null);
        assertThat(result.score()).isGreaterThanOrEqualTo(75);
    }

    @Test
    void juniorCandidateApplyingToSeniorRoleIsDown() {
        var exp = List.of(exp("Junior Developer", "2025-01", "present"));
        var result = scorer.score(exp, "Senior Engineer", null);
        assertThat(result.score()).isLessThanOrEqualTo(50);
        assertThat(result.gap()).contains("underleveled");
    }

    @Test
    void staffCandidateApplyingToMidRoleIsOverleveled() {
        var exp = List.of(
                exp("Staff Engineer", "2014-01", "present")
        );
        var result = scorer.score(exp, "Mid-level Developer", null);
        assertThat(result.score()).isLessThan(100);
        assertThat(result.gap()).contains("overleveled");
    }

    @Test
    void emptyExperienceDefaultsToMid() {
        var result = scorer.score(List.of(), "Senior Engineer", null);
        // mid vs senior = 1 level gap → 75
        assertThat(result.score()).isEqualTo(75);
    }
}
