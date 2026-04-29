package com.jobagent.matcher.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "anthropic")
public record AnthropicProperties(
        String apiKey,
        String baseUrl,
        String model,
        int maxTokens,
        int timeoutSeconds
) {}
