package com.jobagent.tracker.repository;

import com.jobagent.tracker.domain.EmailEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmailEventRepository extends JpaRepository<EmailEvent, UUID> {

    boolean existsByUserIdAndMessageId(UUID userId, String messageId);

    Optional<EmailEvent> findTopByUserIdOrderByReceivedAtDesc(UUID userId);

    List<EmailEvent> findByUserIdOrderByReceivedAtDesc(UUID userId, Pageable pageable);

    @Query("SELECT e FROM EmailEvent e WHERE e.applicationId = :applicationId ORDER BY e.receivedAt DESC")
    List<EmailEvent> findByApplicationId(UUID applicationId);

    // Used by ghosting scheduler: find applied apps with no events after submission
    @Query("""
        SELECT a FROM Application a
        WHERE a.status = 'applied'
          AND a.submittedAt < :cutoff
          AND NOT EXISTS (
              SELECT 1 FROM EmailEvent e
              WHERE e.applicationId = a.id
          )
        """)
    List<com.jobagent.tracker.domain.Application> findGhostedCandidates(Instant cutoff);
}
