package com.jobagent.matcher.scoring;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobagent.matcher.config.AnthropicProperties;
import com.jobagent.matcher.domain.Job;
import com.jobagent.matcher.domain.Profile;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Optional holistic fit scorer using Anthropic. Called only when llm-enabled=true
 * AND preliminary score >= llm-score-threshold. Returns null on failure so the
 * caller can fall back to the deterministic score.
 */
@Component
public class LlmFitScorer {

    private static final Logger log = LoggerFactory.getLogger(LlmFitScorer.class);
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    private static final String SYSTEM_PROMPT = """
            You are a technical recruiter evaluating candidate-job fit.
            Output ONLY a JSON object with these exact keys:
            { "score": integer 0-100, "rationale": string (1-2 sentences), "key_gaps": [string] }
            - score: holistic fit 0-100 considering skills, experience level, domain relevance
            - rationale: concise explanation of the score
            - key_gaps: list of the top 1-3 missing skills or mismatches (empty array if none)
            Output ONLY the JSON. Nothing else.
            """;

    private final AnthropicProperties props;
    private final ObjectMapper mapper;
    private final OkHttpClient http;

    public LlmFitScorer(AnthropicProperties props, ObjectMapper mapper) {
        this.props = props;
        this.mapper = mapper;
        this.http = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(props.timeoutSeconds(), TimeUnit.SECONDS)
                .build();
    }

    public record LlmResult(int score, String rationale, List<String> keyGaps) {}

    /** Returns null if LLM call fails — caller should proceed with deterministic score. */
    public LlmResult score(Job job, Profile profile) {
        String prompt = buildPrompt(job, profile);
        try {
            String json = callAnthropic(prompt);
            return parseResponse(json);
        } catch (Exception e) {
            log.warn("LLM fit scoring failed for job={}: {}", job.getId(), e.getMessage());
            return null;
        }
    }

    private String buildPrompt(Job job, Profile profile) {
        String skills = profile.getSkills() != null ? String.join(", ", profile.getSkills()) : "";
        String jdSnippet = job.getJdBody() != null
                ? job.getJdBody().substring(0, Math.min(800, job.getJdBody().length()))
                : "";
        return String.format("""
                Job: %s at %s
                JD excerpt: %s
                Candidate skills: %s
                Candidate summary: %s
                """, job.getTitle(), job.getCompany(), jdSnippet, skills,
                profile.getSummary() != null ? profile.getSummary() : "(none)");
    }

    private String callAnthropic(String userMessage) throws IOException {
        var body = mapper.writeValueAsString(Map.of(
                "model", props.model(),
                "max_tokens", props.maxTokens(),
                "system", SYSTEM_PROMPT,
                "messages", List.of(Map.of("role", "user", "content", userMessage))
        ));

        var request = new Request.Builder()
                .url(props.baseUrl() + "/v1/messages")
                .header("x-api-key", props.apiKey())
                .header("anthropic-version", "2023-06-01")
                .post(RequestBody.create(body, JSON))
                .build();

        try (var response = http.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("HTTP " + response.code());
            JsonNode node = mapper.readTree(response.body().string());
            return node.at("/content/0/text").asText();
        }
    }

    private LlmResult parseResponse(String json) throws IOException {
        JsonNode node = mapper.readTree(json);
        int score = node.get("score").asInt(50);
        String rationale = node.path("rationale").asText("");
        List<String> gaps = mapper.convertValue(node.path("key_gaps"),
                mapper.getTypeFactory().constructCollectionType(List.class, String.class));
        return new LlmResult(score, rationale, gaps);
    }
}
