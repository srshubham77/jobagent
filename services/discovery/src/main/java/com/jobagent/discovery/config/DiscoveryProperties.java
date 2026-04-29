package com.jobagent.discovery.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "discovery")
public record DiscoveryProperties(
        RemoteOkProperties remoteok,
        SalaryProperties salary,
        int maxJobsPerRun
) {
    public record RemoteOkProperties(
            boolean enabled,
            String apiUrl,
            String cron,
            String userAgent
    ) {}

    public record SalaryProperties(boolean llmClassifyAmbiguous) {}
}
