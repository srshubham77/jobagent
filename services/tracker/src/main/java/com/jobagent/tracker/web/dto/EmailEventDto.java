package com.jobagent.tracker.web.dto;

import com.jobagent.tracker.domain.EmailEvent;

import java.time.Instant;
import java.util.UUID;

public record EmailEventDto(
        UUID id,
        String sender,
        String subject,
        Instant receivedAt,
        String classification,
        double confidence,
        UUID applicationId
) {
    public static EmailEventDto from(EmailEvent e) {
        return new EmailEventDto(
                e.getId(),
                e.getSender(),
                e.getSubject(),
                e.getReceivedAt(),
                e.getClassification(),
                e.getConfidence().doubleValue(),
                e.getApplicationId()
        );
    }
}
