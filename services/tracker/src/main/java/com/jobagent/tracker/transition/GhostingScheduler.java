package com.jobagent.tracker.transition;

import com.jobagent.tracker.config.TrackerProperties;
import com.jobagent.tracker.domain.Application;
import com.jobagent.tracker.repository.ApplicationRepository;
import com.jobagent.tracker.repository.EmailEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Marks applications as closed/ghosted when they've been in "applied" status
 * for more than N days (default 30) with no email events.
 */
@Service
public class GhostingScheduler {

    private static final Logger log = LoggerFactory.getLogger(GhostingScheduler.class);

    private final TrackerProperties props;
    private final ApplicationRepository applicationRepo;
    private final EmailEventRepository eventRepo;

    public GhostingScheduler(TrackerProperties props,
                             ApplicationRepository applicationRepo,
                             EmailEventRepository eventRepo) {
        this.props = props;
        this.applicationRepo = applicationRepo;
        this.eventRepo = eventRepo;
    }

    @Scheduled(cron = "${tracker.ghosting.cron:0 0 2 * * *}")
    @Transactional
    public void markGhosted() {
        Instant cutoff = Instant.now().minus(props.ghosting().days(), ChronoUnit.DAYS);
        List<Application> candidates = eventRepo.findGhostedCandidates(cutoff);

        for (Application app : candidates) {
            app.setStatus("closed");
            app.setClosedTag("ghosted");
            applicationRepo.save(app);
        }

        if (!candidates.isEmpty()) {
            log.info("Ghosting scheduler: marked {} applications as ghosted (cutoff={})",
                    candidates.size(), cutoff);
        }
    }
}
