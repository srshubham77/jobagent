package com.jobagent.tracker.repository;

import com.jobagent.tracker.domain.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {

    // Candidate applications for email matching: applied or active, for a user
    @Query("SELECT a FROM Application a WHERE a.userId = :userId AND a.status IN ('applied','active')")
    List<Application> findActiveForUser(UUID userId);

    List<Application> findByUserId(UUID userId);
}
