package com.jobagent.discovery.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "jobs")
@Getter
@Setter
@NoArgsConstructor
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "external_id", nullable = false)
    private String externalId;

    @Column(nullable = false)
    private String source;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String company;

    private String location;

    @Column(nullable = false)
    private boolean remote = true;

    @Column(name = "salary_mode", nullable = false)
    private String salaryMode = "unstated";

    @Column(name = "salary_min_usd")
    private Integer salaryMinUsd;

    @Column(name = "salary_max_usd")
    private Integer salaryMaxUsd;

    @Column(name = "salary_raw")
    private String salaryRaw;

    @Column(name = "jd_body", columnDefinition = "text")
    private String jdBody;

    @Column(name = "apply_url")
    private String applyUrl;

    @Column(nullable = false)
    private int tier = 2;

    @Column(name = "posted_at")
    private Instant postedAt;

    @Column(name = "discovered_at", nullable = false, updatable = false)
    private Instant discoveredAt = Instant.now();
}
