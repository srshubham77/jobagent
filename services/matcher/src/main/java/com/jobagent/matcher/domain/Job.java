package com.jobagent.matcher.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "jobs")
@Getter
@NoArgsConstructor
public class Job {

    @Id
    private UUID id;

    @Column(name = "external_id")
    private String externalId;

    private String source;
    private String title;
    private String company;
    private String location;
    private boolean remote;

    @Column(name = "salary_mode")
    private String salaryMode;

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

    private int tier;

    @Column(name = "posted_at")
    private Instant postedAt;

    @Column(name = "discovered_at")
    private Instant discoveredAt;
}
