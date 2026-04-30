package com.jobagent.tracker.web;

import com.jobagent.tracker.domain.EmailEvent;
import com.jobagent.tracker.gmail.GmailOAuthService;
import com.jobagent.tracker.gmail.GmailPoller;
import com.jobagent.tracker.repository.EmailEventRepository;
import com.jobagent.tracker.web.dto.EmailEventDto;
import com.jobagent.tracker.web.dto.TrackerStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/tracker")
public class TrackerController {

    private static final Logger log = LoggerFactory.getLogger(TrackerController.class);

    private final GmailOAuthService oauthService;
    private final GmailPoller poller;
    private final EmailEventRepository eventRepo;

    public TrackerController(GmailOAuthService oauthService,
                             GmailPoller poller,
                             EmailEventRepository eventRepo) {
        this.oauthService = oauthService;
        this.poller = poller;
        this.eventRepo = eventRepo;
    }

    /** Redirect the browser to Google's OAuth consent page. */
    @GetMapping("/auth")
    public ResponseEntity<Void> startAuth(@CurrentUserId UUID userId) {
        String url = oauthService.buildAuthUrl(userId);
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url)).build();
    }

    /** Google redirects here after the user grants consent. state = userId. */
    @GetMapping("/callback")
    public ResponseEntity<Map<String, String>> callback(
            @RequestParam String code,
            @RequestParam String state) {

        UUID userId;
        try {
            userId = UUID.fromString(state);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid state parameter"));
        }

        try {
            oauthService.handleCallback(code, userId);
            return ResponseEntity.ok(Map.of("status", "connected", "userId", userId.toString()));
        } catch (IOException e) {
            log.error("OAuth callback failed for userId={}: {}", userId, e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Token exchange failed: " + e.getMessage()));
        }
    }

    /** Connection status and last event time. */
    @GetMapping("/status")
    public ResponseEntity<TrackerStatus> status(@CurrentUserId UUID userId) {
        boolean connected = oauthService.isConnected(userId);
        long total = connected ? eventRepo.findByUserIdOrderByReceivedAtDesc(userId, PageRequest.of(0, 1)).size() : 0;
        var lastEvent = connected
                ? eventRepo.findTopByUserIdOrderByReceivedAtDesc(userId).map(EmailEvent::getReceivedAt).orElse(null)
                : null;
        return ResponseEntity.ok(new TrackerStatus(connected, lastEvent, total));
    }

    /** Recent email events (last 50). */
    @GetMapping("/events")
    public ResponseEntity<List<EmailEventDto>> events(@CurrentUserId UUID userId) {
        List<EmailEventDto> events = eventRepo
                .findByUserIdOrderByReceivedAtDesc(userId, PageRequest.of(0, 50))
                .stream()
                .map(EmailEventDto::from)
                .toList();
        return ResponseEntity.ok(events);
    }

    /** Manually trigger a Gmail poll for this user. */
    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> sync(@CurrentUserId UUID userId) {
        if (!oauthService.isConnected(userId)) {
            return ResponseEntity.status(HttpStatus.PRECONDITION_REQUIRED)
                    .body(Map.of("error", "Gmail not connected. Visit GET /tracker/auth first."));
        }
        try {
            int processed = poller.pollUser(userId);
            return ResponseEntity.ok(Map.of("processed", processed));
        } catch (IOException e) {
            log.error("Manual sync failed for userId={}: {}", userId, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /** Disconnect Gmail — removes stored tokens. */
    @DeleteMapping("/auth")
    public ResponseEntity<Map<String, String>> disconnect(@CurrentUserId UUID userId) {
        oauthService.disconnect(userId);
        return ResponseEntity.ok(Map.of("status", "disconnected"));
    }
}
