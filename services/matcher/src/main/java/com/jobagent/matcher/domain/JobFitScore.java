package com.jobagent.matcher.domain;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "job_fit_scores")
@Getter
@Setter
@NoArgsConstructor
public class JobFitScore {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "job_id", nullable = false)
    private UUID jobId;

    @Column(name = "profile_id", nullable = false)
    private UUID profileId;

    @Column(nullable = false)
    private int score;

    @Column(name = "skill_overlap")
    private Integer skillOverlap;

    @Column(name = "seniority_match")
    private Integer seniorityMatch;

    @Column(name = "stack_overlap")
    private Integer stackOverlap;

    @Column(name = "salary_fit")
    private Integer salaryFit;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> breakdown;

    @Column(name = "computed_at", nullable = false, updatable = false)
    private Instant computedAt = Instant.now();
}
