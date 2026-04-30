package com.jobagent.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "auth")
public record AuthProperties(
    Google google,
    Jwt jwt
) {
    public record Google(String clientId, String clientSecret) {}
    public record Jwt(long accessTokenTtlSeconds, long refreshTokenTtlSeconds) {}
}
