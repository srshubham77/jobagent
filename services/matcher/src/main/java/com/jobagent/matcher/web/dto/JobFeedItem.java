package com.jobagent.matcher.web.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record JobFeedItem(
        UUID scoreId,
        UUID jobId,
        String title,
        String company,
        String location,
        boolean remote,
        String source,
        String salaryMode,
        Integer salaryMinUsd,
        Integer salaryMaxUsd,
        String salaryRaw,
        String applyUrl,
        int tier,
        Instant postedAt,
        int fitScore,
        Integer skillOverlap,
        Integer seniorityMatch,
        Integer salaryFit,
        Map<String, Object> breakdown
) {}
