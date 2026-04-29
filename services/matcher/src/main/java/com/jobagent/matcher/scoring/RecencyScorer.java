package com.jobagent.matcher.scoring;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Scores job recency. Older postings are deprioritised — stale listings waste apply budget.
 * Returns 50 when posted_at is unknown (neutral, not a penalty).
 */
@Component
public class RecencyScorer {

    public int score(Instant postedAt) {
        if (postedAt == null) return 50;

        long days = ChronoUnit.DAYS.between(postedAt, Instant.now());

        if (days <= 3)   return 100;
        if (days <= 7)   return 90;
        if (days <= 14)  return 80;
        if (days <= 30)  return 65;
        if (days <= 60)  return 45;
        if (days <= 90)  return 30;
        return 15;
    }
}
