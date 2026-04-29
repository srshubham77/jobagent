package com.jobagent.discovery;

import okhttp3.mockwebserver.MockWebServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.IOException;

@SpringBootTest
@Testcontainers
public abstract class AbstractIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("pgvector/pgvector:pg16")
                    .withDatabaseName("jobagent_test")
                    .withUsername("jobagent")
                    .withPassword("jobagent");

    public static MockWebServer mockWebServer;

    @BeforeAll
    static void startMockServer() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start();
    }

    @AfterAll
    static void stopMockServer() throws IOException {
        mockWebServer.shutdown();
    }

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("anthropic.api-key", () -> "test-key");
        registry.add("anthropic.base-url", () -> "http://localhost:" + mockWebServer.getPort());
        registry.add("anthropic.model", () -> "claude-haiku-4-5-20251001");
        registry.add("anthropic.max-tokens", () -> "256");
        registry.add("anthropic.timeout-seconds", () -> "10");
        registry.add("discovery.remoteok.api-url",
                () -> "http://localhost:" + mockWebServer.getPort() + "/api");
    }
}
