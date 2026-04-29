package com.jobagent.discovery.salary;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobagent.discovery.config.AnthropicProperties;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * LLM-based salary classifier for cases the regex can't resolve:
 * - non_usd vs usd_implied (company pays remote workers in USD despite non-USD listing)
 * - complex compensation strings the regex doesn't parse
 */
@Component
public class SalaryClassifier {

    private static final Logger log = LoggerFactory.getLogger(SalaryClassifier.class);
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    private static final String SYSTEM_PROMPT = """
            You classify job salary information. Output ONLY a JSON object with these exact keys:
            {
              "mode": "usd_explicit" | "usd_implied" | "unstated" | "non_usd",
              "min_usd": integer or null,
              "max_usd": integer or null
            }

            Rules:
            - usd_explicit: salary clearly stated in USD
            - usd_implied: salary in another currency but the role is remote and the company is known to pay USD to remote workers; convert to USD annual base
            - unstated: no salary info, "competitive", "DOE", etc.
            - non_usd: explicitly in a non-USD currency with no USD path
            - min_usd and max_usd are annual USD integers (no decimals). Null if unknown.
            - For hourly rates multiply by 2080 to annualize.
            - Output ONLY the JSON object. Nothing else.
            """;

    private final AnthropicProperties props;
    private final ObjectMapper mapper;
    private final OkHttpClient http;

    public SalaryClassifier(AnthropicProperties props, ObjectMapper mapper) {
        this.props = props;
        this.mapper = mapper;
        this.http = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(props.timeoutSeconds(), TimeUnit.SECONDS)
                .build();
    }

    /**
     * Classify a salary string + JD context. Only called for ambiguous cases
     * (non-USD currency detected, or unusual phrasing the regex couldn't parse).
     */
    public SalaryResult classify(String salaryRaw, String company, String jdSnippet) {
        String userMessage = buildUserMessage(salaryRaw, company, jdSnippet);
        try {
            String json = callAnthropic(userMessage);
            return parseResponse(json, salaryRaw);
        } catch (Exception e) {
            log.warn("LLM salary classification failed for '{}': {}", salaryRaw, e.getMessage());
            // Fall back to non_usd if we know a foreign currency is present
            return SalaryResult.nonUsd(salaryRaw);
        }
    }

    private String buildUserMessage(String salaryRaw, String company, String jdSnippet) {
        return String.format("""
                Company: %s
                Salary string: %s
                JD excerpt: %s
                """, company, salaryRaw != null ? salaryRaw : "(none)",
                jdSnippet != null ? jdSnippet.substring(0, Math.min(500, jdSnippet.length())) : "(none)");
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
            if (!response.isSuccessful()) {
                throw new IOException("Anthropic API error: " + response.code());
            }
            JsonNode node = mapper.readTree(response.body().string());
            return node.at("/content/0/text").asText();
        }
    }

    private SalaryResult parseResponse(String json, String salaryRaw) throws IOException {
        JsonNode node = mapper.readTree(json);
        String mode   = node.get("mode").asText("unstated");
        JsonNode minN = node.get("min_usd");
        JsonNode maxN = node.get("max_usd");
        Integer min = (minN != null && !minN.isNull()) ? minN.intValue() : null;
        Integer max = (maxN != null && !maxN.isNull()) ? maxN.intValue() : null;
        return new SalaryResult(mode, min, max, salaryRaw);
    }
}
