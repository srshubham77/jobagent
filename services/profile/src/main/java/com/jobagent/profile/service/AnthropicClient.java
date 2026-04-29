package com.jobagent.profile.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobagent.profile.config.AnthropicProperties;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Component
public class AnthropicClient {

    private static final Logger log = LoggerFactory.getLogger(AnthropicClient.class);
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    private static final String SYSTEM_PROMPT = """
            You extract structured data from resume text. Output ONLY a single JSON object — \
            no prose, no markdown, no code fences. The JSON must conform to this exact schema:
            {
              "contact":        { "name": string|null, "email": string|null, "phone": string|null, "location": string|null, "linkedin": string|null, "github": string|null },
              "summary":        string|null,
              "experience":     [{ "company": string, "title": string, "startDate": string|null, "endDate": string|null, "location": string|null, "bullets": [string] }],
              "education":      [{ "institution": string, "degree": string|null, "field": string|null, "graduationDate": string|null }],
              "skills":         [string],
              "projects":       [{ "name": string, "description": string|null, "technologies": [string], "url": string|null }],
              "certifications": [string]
            }
            Rules:
            - Do NOT invent or infer information not present in the resume text.
            - Use null for missing fields, never omit keys.
            - skills must be a flat list of strings, one technology/skill per item.
            - bullets must be verbatim or lightly cleaned resume bullet points.
            - Output ONLY valid JSON. Nothing else.
            """;

    private final AnthropicProperties props;
    private final ObjectMapper mapper;
    private final OkHttpClient http;

    public AnthropicClient(AnthropicProperties props, ObjectMapper mapper) {
        this.props = props;
        this.mapper = mapper;
        this.http = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(props.timeoutSeconds(), TimeUnit.SECONDS)
                .build();
    }

    public String parseResumeText(String resumeText) throws IOException {
        var body = mapper.writeValueAsString(Map.of(
                "model", props.model(),
                "max_tokens", props.maxTokens(),
                "system", SYSTEM_PROMPT,
                "messages", List.of(
                        Map.of("role", "user", "content", resumeText)
                )
        ));

        var request = new Request.Builder()
                .url(props.baseUrl() + "/v1/messages")
                .header("x-api-key", props.apiKey())
                .header("anthropic-version", "2023-06-01")
                .post(RequestBody.create(body, JSON))
                .build();

        try (var response = http.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Anthropic API error: " + response.code() + " " + response.message());
            }
            var responseBody = response.body().string();
            log.debug("Anthropic raw response length={}", responseBody.length());
            JsonNode node = mapper.readTree(responseBody);
            return node.at("/content/0/text").asText();
        }
    }
}
