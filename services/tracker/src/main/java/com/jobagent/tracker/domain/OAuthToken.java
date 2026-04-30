package com.jobagent.tracker.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "oauth_tokens")
@Getter
@Setter
@NoArgsConstructor
public class OAuthToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String provider;

    @Column(name = "access_token_enc", nullable = false)
    private byte[] accessTokenEnc;

    @Column(name = "refresh_token_enc", nullable = false)
    private byte[] refreshTokenEnc;

    @Column(name = "expires_at")
    private Instant expiresAt;

    private String scope;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void touch() { this.updatedAt = Instant.now(); }
}
