package com.jobagent.matcher.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "matcher")
public record MatcherProperties(
        int batchSize,
        long scoringDelayMs,
        Weights weights,
        int llmScoreThreshold,
        boolean llmEnabled
) {
    public record Weights(
            double skillOverlap,
            double seniority,
            double salaryFit,
            double recency
    ) {}
}
