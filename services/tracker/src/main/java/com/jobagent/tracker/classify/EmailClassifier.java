package com.jobagent.tracker.classify;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobagent.tracker.config.AnthropicProperties;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * Classifies a recruiter/rejection/offer email using Claude Haiku.
 * Only sender, subject, and Gmail snippet are sent — never full body (PRD §6.13).
 */
@Component
public class EmailClassifier {

    private static final Logger log = LoggerFactory.getLogger(EmailClassifier.class);

    private static final Set<String> VALID_LABELS = Set.of(
            "ack", "recruiter_contact", "interview_scheduling", "rejection", "offer", "irrelevant"
    );

    private static final String SYSTEM = """
            You classify emails related to job applications.

            Categories:
            - ack: Automated confirmation of application receipt ("We received your application...")
            - recruiter_contact: A human recruiter or hiring manager reaching out to express interest or ask questions
            - interview_scheduling: Scheduling or confirming an interview (phone screen, technical, onsite)
            - rejection: Explicit rejection ("We've moved forward with other candidates", "not moving forward")
            - offer: Job offer or verbal offer
            - irrelevant: Unrelated to a job application (newsletters, promotions, personal emails, spam)

            Respond ONLY with valid JSON:
            {"classification": "<label>", "confidence": <0.0-1.0>}

            Do NOT include any other text.
            """;

    private final AnthropicProperties anthropic;
    private final ObjectMapper mapper;
    private final OkHttpClient http;

    public EmailClassifier(AnthropicProperties anthropic, ObjectMapper mapper) {
        this.anthropic = anthropic;
        this.mapper = mapper;
        int timeoutSecs = anthropic != null ? anthropic.timeoutSeconds() : 30;
        this.http = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(timeoutSecs, TimeUnit.SECONDS)
                .build();
    }

    public ClassificationResult classify(String sender, String subject, String snippet) {
        // Quick pre-filter: clearly irrelevant senders save LLM spend
        if (sender != null && isKnownSpam(sender)) return ClassificationResult.irrelevant();

        String userPrompt = buildPrompt(sender, subject, snippet);
        try {
            String json = callLlm(userPrompt);
            return parse(json);
        } catch (Exception e) {
            log.warn("Email classification failed, defaulting to irrelevant: {}", e.getMessage());
            return ClassificationResult.irrelevant();
        }
    }

    String buildPrompt(String sender, String subject, String snippet) {
        return "From: " + orEmpty(sender) + "\n"
                + "Subject: " + orEmpty(subject) + "\n"
                + "Snippet: " + orEmpty(snippet);
    }

    ClassificationResult parse(String json) {
        try {
            JsonNode node = mapper.readTree(json.trim());
            String classification = node.path("classification").asText("irrelevant");
            double confidence = node.path("confidence").asDouble(0.5);
            if (!VALID_LABELS.contains(classification)) {
                log.warn("LLM returned unknown classification '{}', defaulting to irrelevant", classification);
                return ClassificationResult.irrelevant();
            }
            return new ClassificationResult(classification, Math.max(0.0, Math.min(1.0, confidence)));
        } catch (Exception e) {
            log.warn("Failed to parse classification JSON '{}': {}", json, e.getMessage());
            return ClassificationResult.irrelevant();
        }
    }

    private String callLlm(String userPrompt) throws IOException {
        String payload = mapper.writeValueAsString(mapper.createObjectNode()
                .put("model", anthropic.model())
                .put("max_tokens", anthropic.maxTokens())
                .put("system", SYSTEM)
                .set("messages", mapper.createArrayNode().add(
                        mapper.createObjectNode()
                                .put("role", "user")
                                .put("content", userPrompt)
                )));

        Request request = new Request.Builder()
                .url(anthropic.baseUrl() + "/v1/messages")
                .header("x-api-key", anthropic.apiKey())
                .header("anthropic-version", "2023-06-01")
                .post(RequestBody.create(payload, MediaType.get("application/json")))
                .build();

        try (Response response = http.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Anthropic API HTTP " + response.code());
            }
            JsonNode root = mapper.readTree(response.body().string());
            return root.path("content").get(0).path("text").asText();
        }
    }

    private static boolean isKnownSpam(String sender) {
        String lower = sender.toLowerCase();
        return lower.contains("noreply@") || lower.contains("no-reply@")
                || lower.contains("newsletter") || lower.contains("linkedin.com")
                || lower.contains("notifications@");
    }

    private static String orEmpty(String s) {
        return s == null ? "" : s;
    }
}
