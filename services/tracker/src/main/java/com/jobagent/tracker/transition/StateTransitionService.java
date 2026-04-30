package com.jobagent.tracker.transition;

import com.jobagent.tracker.domain.Application;
import com.jobagent.tracker.repository.ApplicationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Applies email classification → application state transitions.
 *
 * State machine (forward-only per PRD §6.12):
 *   applied  + recruiter_contact/interview_scheduling → active
 *   applied  + rejection  → closed / rejected
 *   applied  + offer      → closed / offer
 *   active   + rejection  → closed / rejected
 *   active   + offer      → closed / offer
 *   active   + interview_scheduling → stays active (already there)
 *   ack      → no change (just confirmation, not a human signal)
 */
@Service
public class StateTransitionService {

    private static final Logger log = LoggerFactory.getLogger(StateTransitionService.class);

    private final ApplicationRepository applicationRepo;

    public StateTransitionService(ApplicationRepository applicationRepo) {
        this.applicationRepo = applicationRepo;
    }

    @Transactional
    public void applyTransition(UUID applicationId, String classification) {
        Application app = applicationRepo.findById(applicationId).orElse(null);
        if (app == null) {
            log.warn("applyTransition: applicationId={} not found", applicationId);
            return;
        }

        String before = app.getStatus();
        String[] next = computeNext(before, classification);
        if (next == null) {
            log.debug("No transition for status={} classification={}", before, classification);
            return;
        }

        app.setStatus(next[0]);
        if (next[1] != null) app.setClosedTag(next[1]);
        applicationRepo.save(app);

        log.info("State transition applicationId={} {} → {} (closedTag={}) via {}",
                applicationId, before, next[0], next[1], classification);
    }

    /** Returns [newStatus, closedTag] or null if no transition applies. closedTag may be null. */
    static String[] computeNext(String status, String classification) {
        return switch (classification) {
            case "recruiter_contact", "interview_scheduling" -> switch (status) {
                case "applied" -> new String[]{"active", null};
                default -> null; // already active or beyond
            };
            case "rejection" -> switch (status) {
                case "applied", "active" -> new String[]{"closed", "rejected"};
                default -> null;
            };
            case "offer" -> switch (status) {
                case "applied", "active" -> new String[]{"closed", "offer"};
                default -> null;
            };
            default -> null; // ack, irrelevant
        };
    }
}
