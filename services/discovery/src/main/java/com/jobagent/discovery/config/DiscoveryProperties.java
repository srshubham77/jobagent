package com.jobagent.discovery.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "discovery")
public record DiscoveryProperties(
        RemoteOkProperties remoteok,
        WwrProperties weworkremotely,
        HnProperties hn,
        SalaryProperties salary,
        int maxJobsPerRun
) {
    public record RemoteOkProperties(
            boolean enabled,
            String apiUrl,
            String cron,
            String userAgent
    ) {}

    public record WwrProperties(
            boolean enabled,
            String feedUrl,
            String cron,
            String userAgent
    ) {}

    public record HnProperties(
            boolean enabled,
            String cron,
            String userAgent
    ) {}

    public record SalaryProperties(boolean llmClassifyAmbiguous) {}
}
