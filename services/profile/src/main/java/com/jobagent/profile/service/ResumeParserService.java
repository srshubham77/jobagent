package com.jobagent.profile.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobagent.profile.domain.EducationEntry;
import com.jobagent.profile.domain.ExperienceEntry;
import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

@Service
public class ResumeParserService {

    private static final Logger log = LoggerFactory.getLogger(ResumeParserService.class);
    private static final int MIN_TEXT_LENGTH = 100;

    private final Tika tika;
    private final AnthropicClient anthropicClient;
    private final ObjectMapper mapper;

    public ResumeParserService(AnthropicClient anthropicClient, ObjectMapper mapper) {
        this.tika = new Tika();
        this.anthropicClient = anthropicClient;
        this.mapper = mapper;
    }

    public ParsedResume parse(InputStream stream, String filename) throws IOException {
        String rawText;
        try {
            rawText = tika.parseToString(stream);
        } catch (TikaException e) {
            throw new IOException("Failed to extract text from " + filename, e);
        }

        if (rawText == null || rawText.isBlank() || rawText.length() < MIN_TEXT_LENGTH) {
            throw new IllegalArgumentException("Could not extract meaningful text from the uploaded file");
        }

        log.info("Extracted {} chars from {}, sending to Anthropic", rawText.length(), filename);
        String json = anthropicClient.parseResumeText(rawText);

        Map<String, Object> parsed = mapper.readValue(json, new TypeReference<>() {});

        @SuppressWarnings("unchecked")
        var contact = (Map<String, Object>) parsed.getOrDefault("contact", Map.of());
        var summary  = (String) parsed.get("summary");
        var skills   = mapper.convertValue(parsed.getOrDefault("skills", List.of()), new TypeReference<List<String>>() {});
        var certs    = mapper.convertValue(parsed.getOrDefault("certifications", List.of()), new TypeReference<List<String>>() {});
        var projects = mapper.convertValue(parsed.getOrDefault("projects", List.of()), new TypeReference<List<Map<String, Object>>>() {});
        var exp      = mapper.convertValue(parsed.getOrDefault("experience", List.of()), new TypeReference<List<ExperienceEntry>>() {});
        var edu      = mapper.convertValue(parsed.getOrDefault("education", List.of()), new TypeReference<List<EducationEntry>>() {});

        return new ParsedResume(rawText, contact, summary, exp, edu, skills, projects, certs);
    }

    public record ParsedResume(
            String rawText,
            Map<String, Object> contact,
            String summary,
            List<ExperienceEntry> experience,
            List<EducationEntry> education,
            List<String> skills,
            List<Map<String, Object>> projects,
            List<String> certifications
    ) {}
}
