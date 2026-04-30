package com.jobagent.tracker.gmail;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobagent.tracker.classify.ClassificationResult;
import com.jobagent.tracker.classify.EmailClassifier;
import com.jobagent.tracker.domain.EmailEvent;
import com.jobagent.tracker.domain.OAuthToken;
import com.jobagent.tracker.match.ApplicationMatcher;
import com.jobagent.tracker.repository.EmailEventRepository;
import com.jobagent.tracker.repository.OAuthTokenRepository;
import com.jobagent.tracker.transition.StateTransitionService;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class GmailPoller {

    private static final Logger log = LoggerFactory.getLogger(GmailPoller.class);
    private static final String GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

    private final OAuthTokenRepository oauthRepo;
    private final EmailEventRepository eventRepo;
    private final GmailOAuthService oauthService;
    private final EmailClassifier classifier;
    private final ApplicationMatcher matcher;
    private final StateTransitionService transitionService;
    private final ObjectMapper mapper;
    private final OkHttpClient http;

    public GmailPoller(OAuthTokenRepository oauthRepo,
                       EmailEventRepository eventRepo,
                       GmailOAuthService oauthService,
                       EmailClassifier classifier,
                       ApplicationMatcher matcher,
                       StateTransitionService transitionService,
                       ObjectMapper mapper) {
        this.oauthRepo = oauthRepo;
        this.eventRepo = eventRepo;
        this.oauthService = oauthService;
        this.classifier = classifier;
        this.matcher = matcher;
        this.transitionService = transitionService;
        this.mapper = mapper;
        this.http = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(20, TimeUnit.SECONDS)
                .build();
    }

    @Scheduled(cron = "${tracker.gmail.poll-cron:0 */5 * * * *}")
    public void pollAll() {
        List<OAuthToken> tokens = oauthRepo.findAllByProvider(GmailOAuthService.PROVIDER);
        log.info("Gmail poll starting for {} connected users", tokens.size());
        for (OAuthToken token : tokens) {
            try {
                pollUser(token.getUserId());
            } catch (Exception e) {
                log.error("Poll failed for userId={}: {}", token.getUserId(), e.getMessage());
            }
        }
    }

    /** Public so TrackerController can trigger a manual sync. */
    @Transactional
    public int pollUser(UUID userId) throws IOException {
        String accessToken = oauthService.getAccessToken(userId).orElse(null);
        if (accessToken == null) {
            log.warn("No valid access token for userId={}", userId);
            return 0;
        }

        // Find the latest message we've already seen to use as a query window
        String afterEpoch = eventRepo.findTopByUserIdOrderByReceivedAtDesc(userId)
                .map(e -> String.valueOf(e.getReceivedAt().getEpochSecond()))
                .orElse("0");

        List<String> messageIds = listMessageIds(accessToken, afterEpoch);
        int processed = 0;

        for (String messageId : messageIds) {
            if (eventRepo.existsByUserIdAndMessageId(userId, messageId)) continue;

            try {
                processMessage(userId, messageId, accessToken);
                processed++;
            } catch (Exception e) {
                log.warn("Failed to process messageId={}: {}", messageId, e.getMessage());
            }
        }

        log.info("pollUser userId={} processed={} of {} new messages", userId, processed, messageIds.size());
        return processed;
    }

    private void processMessage(UUID userId, String messageId, String accessToken) throws IOException {
        JsonNode msg = getMessage(accessToken, messageId);

        String sender  = header(msg, "From");
        String subject = header(msg, "Subject");
        String snippet = msg.path("snippet").asText("");
        String threadId = msg.path("threadId").asText(null);
        long epochMs = msg.path("internalDate").asLong(0);
        Instant receivedAt = epochMs > 0 ? Instant.ofEpochMilli(epochMs) : Instant.now();

        // PRD: process in-memory only — do NOT persist raw body or full headers
        ClassificationResult result = classifier.classify(sender, subject, snippet);
        if ("irrelevant".equals(result.classification())) return;

        UUID applicationId = matcher.match(userId, sender, subject, snippet).orElse(null);

        EmailEvent event = new EmailEvent();
        event.setUserId(userId);
        event.setMessageId(messageId);
        event.setThreadId(threadId);
        event.setSender(truncate(sender, 500));
        event.setSubject(truncate(subject, 500));
        event.setReceivedAt(receivedAt);
        event.setClassification(result.classification());
        event.setConfidence(BigDecimal.valueOf(result.confidence()));
        event.setApplicationId(applicationId);
        eventRepo.save(event);

        if (applicationId != null && result.confidence() >= 0.70) {
            transitionService.applyTransition(applicationId, result.classification());
        }
    }

    private List<String> listMessageIds(String accessToken, String afterEpoch) throws IOException {
        String query = "is:inbox after:" + afterEpoch;
        String url = GMAIL_API + "/messages?maxResults=50&q=" + java.net.URLEncoder.encode(query, "UTF-8");

        JsonNode root = getJson(accessToken, url);
        List<String> ids = new ArrayList<>();
        for (JsonNode msg : root.path("messages")) {
            String id = msg.path("id").asText(null);
            if (id != null) ids.add(id);
        }
        return ids;
    }

    private JsonNode getMessage(String accessToken, String messageId) throws IOException {
        // Only fetch metadata + snippet — not the full raw message (PRD requirement)
        String url = GMAIL_API + "/messages/" + messageId + "?format=metadata"
                + "&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date";
        return getJson(accessToken, url);
    }

    private JsonNode getJson(String accessToken, String url) throws IOException {
        Request request = new Request.Builder()
                .url(url)
                .header("Authorization", "Bearer " + accessToken)
                .build();
        try (Response response = http.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Gmail API HTTP " + response.code() + " for " + url);
            }
            return mapper.readTree(response.body().string());
        }
    }

    private static String header(JsonNode msg, String name) {
        for (JsonNode h : msg.path("payload").path("headers")) {
            if (name.equalsIgnoreCase(h.path("name").asText(""))) {
                return h.path("value").asText(null);
            }
        }
        return null;
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
