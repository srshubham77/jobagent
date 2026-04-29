package com.jobagent.matcher.repository;

import com.jobagent.matcher.domain.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface JobRepository extends JpaRepository<Job, UUID> {

    /** Jobs that have no fit score for the given profile yet. */
    @Query(value = """
            SELECT j.* FROM jobs j
            WHERE NOT EXISTS (
                SELECT 1 FROM job_fit_scores s
                WHERE s.job_id = j.id
                  AND s.profile_id = :profileId
            )
            ORDER BY j.discovered_at DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Job> findUnscoredForProfile(UUID profileId, int limit);
}
