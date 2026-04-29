package com.jobagent.profile.repository;

import com.jobagent.profile.domain.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProfileRepository extends JpaRepository<Profile, UUID> {

    Optional<Profile> findByUserIdAndIsCurrentTrue(UUID userId);

    List<Profile> findByUserIdOrderByVersionNumberDesc(UUID userId);

    @Query("SELECT COALESCE(MAX(p.versionNumber), 0) FROM Profile p WHERE p.userId = :userId")
    int maxVersionNumber(UUID userId);

    @Modifying
    @Query("UPDATE Profile p SET p.isCurrent = false WHERE p.userId = :userId AND p.isCurrent = true")
    void clearCurrent(UUID userId);
}
