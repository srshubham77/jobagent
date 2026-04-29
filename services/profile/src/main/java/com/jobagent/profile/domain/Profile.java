package com.jobagent.profile.domain;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "profiles")
@Getter
@Setter
@NoArgsConstructor
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "version_number", nullable = false)
    private int versionNumber;

    @Column(name = "is_current", nullable = false)
    private boolean isCurrent;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> contact;

    private String summary;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private List<ExperienceEntry> experience;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private List<EducationEntry> education;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> skills;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private List<Map<String, Object>> projects;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> certifications;

    @Column(name = "raw_text", columnDefinition = "text")
    private String rawText;

    @Column(name = "parse_source")
    private String parseSource = "tika";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
