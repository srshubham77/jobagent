package com.jobagent.matcher.scoring;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SkillOverlapScorerTest {

    private final SkillOverlapScorer scorer = new SkillOverlapScorer();

    @Test
    void perfectOverlapScores100() {
        var result = scorer.score(
                List.of("Java", "Spring Boot", "Kafka"),
                List.of("java", "spring boot", "kafka"),
                null);
        assertThat(result.score()).isEqualTo(100);
        assertThat(result.missing()).isEmpty();
    }

    @Test
    void zeroOverlapScoresLow() {
        var result = scorer.score(
                List.of("Java", "Spring"),
                List.of("go", "kubernetes", "rust"),
                null);
        assertThat(result.score()).isLessThan(20);
        assertThat(result.matched()).isEmpty();
    }

    @Test
    void partialOverlapIsBetween() {
        var result = scorer.score(
                List.of("Java", "Spring Boot", "Postgres"),
                List.of("java", "spring boot", "kafka", "redis"),
                null);
        assertThat(result.score()).isBetween(30, 80);
        assertThat(result.matched()).containsExactlyInAnyOrder("java", "spring boot");
        assertThat(result.missing()).containsExactlyInAnyOrder("kafka", "redis");
    }

    @Test
    void noJdTagsReturnsNeutral() {
        var result = scorer.score(List.of("Java"), List.of(), null);
        assertThat(result.score()).isEqualTo(50);
    }

    @Test
    void jdBodyExtractsSkillsWhenNoTags() {
        var result = scorer.score(
                List.of("Kotlin", "Gradle"),
                List.of(),
                "We need strong Kotlin and Gradle experience.");
        // Kotlin and Gradle should be extracted from body
        assertThat(result.score()).isGreaterThan(50);
    }
}
