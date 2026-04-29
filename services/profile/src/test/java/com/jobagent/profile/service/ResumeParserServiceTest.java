package com.jobagent.profile.service;

import com.jobagent.profile.AbstractIntegrationTest;
import okhttp3.mockwebserver.MockResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ResumeParserServiceTest extends AbstractIntegrationTest {

    @Autowired ResumeParserService parserService;

    private static final String VALID_ANTHROPIC_RESPONSE = """
            {
              "id": "msg_123",
              "type": "message",
              "content": [{
                "type": "text",
                "text": "{\\"contact\\":{\\"name\\":\\"Jane Doe\\",\\"email\\":\\"jane@example.com\\",\\"phone\\":null,\\"location\\":\\"Remote\\",\\"linkedin\\":null,\\"github\\":null},\\"summary\\":\\"Senior backend engineer\\",\\"experience\\":[],\\"education\\":[],\\"skills\\":[\\"Java\\",\\"Spring Boot\\"],\\"projects\\":[],\\"certifications\\":[]}"
              }]
            }
            """;

    @Test
    void parsesValidPdf() throws Exception {
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(VALID_ANTHROPIC_RESPONSE));

        String resumeText = "A".repeat(200); // minimal text to pass length check
        var result = parserService.parse(
                new ByteArrayInputStream(resumeText.getBytes(StandardCharsets.UTF_8)),
                "resume.txt");

        assertThat(result.contact()).containsKey("name");
        assertThat(result.skills()).containsExactly("Java", "Spring Boot");
        assertThat(result.summary()).isEqualTo("Senior backend engineer");
    }

    @Test
    void throwsOnEmptyFile() {
        assertThatThrownBy(() -> parserService.parse(
                new ByteArrayInputStream(new byte[0]), "empty.pdf"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("meaningful text");
    }

    @Test
    void throwsOnTooShortText() {
        assertThatThrownBy(() -> parserService.parse(
                new ByteArrayInputStream("too short".getBytes()), "tiny.txt"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void throwsOnAnthropicError() {
        mockWebServer.enqueue(new MockResponse().setResponseCode(429).setBody("rate limited"));

        String resumeText = "A".repeat(200);
        assertThatThrownBy(() -> parserService.parse(
                new ByteArrayInputStream(resumeText.getBytes(StandardCharsets.UTF_8)),
                "resume.txt"))
                .isInstanceOf(Exception.class);
    }
}
