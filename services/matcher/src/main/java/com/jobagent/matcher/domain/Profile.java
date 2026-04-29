package com.jobagent.matcher.domain;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "profiles")
@Getter
@NoArgsConstructor
public class Profile {

    @Id
    private UUID id;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "version_number")
    private int versionNumber;

    @Column(name = "is_current")
    private boolean isCurrent;

    private String summary;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private List<String> skills;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private List<Map<String, Object>> experience;

    @Column(name = "created_at")
    private Instant createdAt;
}
