package com.jobagent.profile.domain;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "user_preferences")
@Getter
@Setter
@NoArgsConstructor
public class UserPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "target_title")
    private String targetTitle;

    @Type(JsonBinaryType.class)
    @Column(name = "target_stack", columnDefinition = "jsonb")
    private List<String> targetStack;

    @Column(name = "min_salary")
    private Integer minSalary;

    private String location;

    @Column(name = "auto_apply_threshold")
    private int autoApplyThreshold = 80;

    @Column(name = "usd_only")
    private boolean usdOnly = true;

    @Column(name = "agent_enabled")
    private boolean agentEnabled = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void touch() {
        this.updatedAt = Instant.now();
    }

    public static UserPreferences defaults(UUID userId) {
        var p = new UserPreferences();
        p.setUserId(userId);
        return p;
    }
}
