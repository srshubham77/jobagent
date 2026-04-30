package com.jobagent.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StateStore {
    private final StringRedisTemplate redis;

    private static final String PREFIX = "oauth-state:";
    private static final Duration TTL = Duration.ofMinutes(5);

    public String generate() {
        String state = UUID.randomUUID().toString();
        redis.opsForValue().set(PREFIX + state, "valid", TTL);
        return state;
    }

    public boolean consume(String state) {
        return Boolean.TRUE.equals(redis.delete(PREFIX + state));
    }
}
