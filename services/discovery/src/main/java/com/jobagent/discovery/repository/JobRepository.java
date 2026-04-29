package com.jobagent.discovery.repository;

import com.jobagent.discovery.domain.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JobRepository extends JpaRepository<Job, UUID> {

    Optional<Job> findBySourceAndExternalId(String source, String externalId);

    boolean existsBySourceAndExternalId(String source, String externalId);

    @Query("""
            SELECT j FROM Job j
            WHERE j.company = :company
              AND j.title LIKE :titlePattern
            ORDER BY j.discoveredAt DESC
            """)
    List<Job> findDuplicateCandidates(String company, String titlePattern);
}
