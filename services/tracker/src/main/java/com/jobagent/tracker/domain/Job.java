package com.jobagent.tracker.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "jobs")
@Getter
@Setter
@NoArgsConstructor
public class Job {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String company;

    @Column(name = "apply_url")
    private String applyUrl;
}
