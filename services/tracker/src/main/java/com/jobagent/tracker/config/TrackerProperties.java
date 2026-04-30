package com.jobagent.tracker.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "tracker")
public record TrackerProperties(
        GmailProperties gmail,
        GhostingProperties ghosting,
        String encryptionKey,
        String appBaseUrl
) {
    public record GmailProperties(
            String clientId,
            String clientSecret,
            String redirectUri,
            String pollCron
    ) {}

    public record GhostingProperties(int days, String cron) {}
}
