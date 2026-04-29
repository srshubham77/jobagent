package com.jobagent.matcher.scoring;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SalaryFitScorerTest {

    private final SalaryFitScorer scorer = new SalaryFitScorer();

    @Test
    void midpointExceedsTargetScoresHigh() {
        // Job: $160k-$220k, candidate wants $180k → mid=$190k > $180k
        var r = scorer.score("usd_explicit", 160_000, 220_000, 180_000);
        assertThat(r.score()).isGreaterThanOrEqualTo(90);
    }

    @Test
    void minWithin10PercentScoresMid() {
        // Job: $162k (min only), candidate wants $180k → 10% below
        var r = scorer.score("usd_explicit", 162_000, null, 180_000);
        assertThat(r.score()).isBetween(60, 79);
    }

    @Test
    void wellBelowTargetScoresLow() {
        // Job: $100k, candidate wants $180k → 44% below
        var r = scorer.score("usd_explicit", 100_000, null, 180_000);
        assertThat(r.score()).isLessThan(30);
    }

    @Test
    void unstatedSalaryIsNeutral() {
        var r = scorer.score("unstated", null, null, 180_000);
        assertThat(r.score()).isEqualTo(50);
    }

    @Test
    void nonUsdIsSoftPenalty() {
        var r = scorer.score("non_usd", null, null, 180_000);
        assertThat(r.score()).isEqualTo(30);
    }

    @Test
    void noTargetSalaryIsNeutral() {
        var r = scorer.score("usd_explicit", 200_000, null, null);
        assertThat(r.score()).isEqualTo(50);
    }
}
