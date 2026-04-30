package com.jobagent.auth.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobagent.auth.config.AuthProperties;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenStore {
    private final StringRedisTemplate redis;
    private final AuthProperties props;
    private final ObjectMapper objectMapper;

    private static final String PREFIX = "refresh:";

    public record Entry(String userId, String email, String name) {}

    @SneakyThrows
    public String create(Entry entry) {
        String token = UUID.randomUUID().toString();
        redis.opsForValue().set(
            PREFIX + token,
            objectMapper.writeValueAsString(entry),
            Duration.ofSeconds(props.jwt().refreshTokenTtlSeconds())
        );
        return token;
    }

    @SneakyThrows
    public Optional<Entry> get(String token) {
        String json = redis.opsForValue().get(PREFIX + token);
        if (json == null) return Optional.empty();
        return Optional.of(objectMapper.readValue(json, Entry.class));
    }

    public void revoke(String token) {
        redis.delete(PREFIX + token);
    }
}
