package com.jobagent.matcher.repository;

import com.jobagent.matcher.domain.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProfileRepository extends JpaRepository<Profile, UUID> {
    Optional<Profile> findByUserIdAndIsCurrentTrue(UUID userId);
}
