package com.jobagent.discovery.crawler;

import com.jobagent.discovery.AbstractIntegrationTest;
import com.jobagent.discovery.repository.JobRepository;
import okhttp3.mockwebserver.MockResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

class RemoteOkCrawlerTest extends AbstractIntegrationTest {

    @Autowired RemoteOkCrawler crawler;
    @Autowired JobRepository jobRepository;

    private static final String REMOTEOK_RESPONSE = """
            [
              {"legal": "RemoteOK legal notice"},
              {
                "id": "remoteok-123456",
                "epoch": 1714500000,
                "url": "https://remoteok.com/jobs/123456",
                "title": "Senior Backend Engineer",
                "company": "Acme Corp",
                "location": "Remote",
                "description": "We pay $160,000-$200,000 per year. Join our team.",
                "salary_min": 160000,
                "salary_max": 200000,
                "apply_url": "https://jobs.lever.co/acme/abc123",
                "tags": ["java", "spring", "remote"]
              }
            ]
            """;

    @BeforeEach
    void cleanup() {
        jobRepository.deleteAll();
    }

    @Test
    void savesNewJobFromApi() {
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(REMOTEOK_RESPONSE));

        CrawlResult result = crawler.run();

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.saved()).isEqualTo(1);
        assertThat(result.skipped()).isEqualTo(0);

        var saved = jobRepository.findBySourceAndExternalId("remoteok", "remoteok-123456");
        assertThat(saved).isPresent();
        assertThat(saved.get().getTitle()).isEqualTo("Senior Backend Engineer");
        assertThat(saved.get().getSalaryMode()).isEqualTo("usd_explicit");
        assertThat(saved.get().getSalaryMinUsd()).isEqualTo(160_000);
        assertThat(saved.get().getTier()).isEqualTo(1); // lever.co → tier 1
    }

    @Test
    void skipsAlreadySeenJob() {
        // First run
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(REMOTEOK_RESPONSE));
        crawler.run();

        // Second run — same data
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(REMOTEOK_RESPONSE));
        CrawlResult second = crawler.run();

        assertThat(second.saved()).isEqualTo(0);
        assertThat(second.skipped()).isEqualTo(1);
        assertThat(jobRepository.count()).isEqualTo(1);
    }

    @Test
    void returnsFailureOnApiError() {
        mockWebServer.enqueue(new MockResponse().setResponseCode(503));

        CrawlResult result = crawler.run();

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.errorMessage()).isNotBlank();
    }
}
