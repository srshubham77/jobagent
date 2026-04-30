package com.jobagent.tracker.repository;

import com.jobagent.tracker.domain.OAuthToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OAuthTokenRepository extends JpaRepository<OAuthToken, UUID> {
    Optional<OAuthToken> findByUserIdAndProvider(UUID userId, String provider);
    List<OAuthToken> findAllByProvider(String provider);
}
