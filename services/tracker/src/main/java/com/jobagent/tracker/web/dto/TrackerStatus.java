package com.jobagent.tracker.web.dto;

import java.time.Instant;

public record TrackerStatus(
        boolean connected,
        Instant lastEventAt,
        long totalEvents
) {}
