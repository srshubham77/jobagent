package com.jobagent.profile.repository;

import com.jobagent.profile.domain.Story;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StoryRepository extends JpaRepository<Story, UUID> {

    List<Story> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<Story> findByIdAndUserId(UUID id, UUID userId);

    @Query(value = """
            SELECT * FROM stories
            WHERE user_id = :userId
              AND themes @> CAST(:theme AS jsonb)
            ORDER BY created_at DESC
            """, nativeQuery = true)
    List<Story> findByUserIdAndTheme(UUID userId, String theme);
}
