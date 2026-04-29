package com.jobagent.matcher.repository;

import com.jobagent.matcher.domain.JobFitScore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JobFitScoreRepository extends JpaRepository<JobFitScore, UUID> {

    Optional<JobFitScore> findByJobIdAndProfileId(UUID jobId, UUID profileId);

    List<JobFitScore> findByProfileIdOrderByScoreDesc(UUID profileId);
}
