package com.jobagent.discovery.crawler;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobagent.discovery.config.DiscoveryProperties;
import com.jobagent.discovery.crawler.dto.RemoteOkJob;
import com.jobagent.discovery.domain.Job;
import com.jobagent.discovery.repository.JobRepository;
import com.jobagent.discovery.salary.SalaryClassifier;
import com.jobagent.discovery.salary.SalaryNormalizer;
import com.jobagent.discovery.salary.SalaryResult;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Component
public class RemoteOkCrawler implements Crawler {

    private static final Logger log = LoggerFactory.getLogger(RemoteOkCrawler.class);
    public static final String SOURCE = "remoteok";

    private final DiscoveryProperties props;
    private final JobRepository jobRepository;
    private final SalaryNormalizer salaryNormalizer;
    private final SalaryClassifier salaryClassifier;
    private final ObjectMapper mapper;
    private final OkHttpClient http;

    public RemoteOkCrawler(DiscoveryProperties props,
                           JobRepository jobRepository,
                           SalaryNormalizer salaryNormalizer,
                           SalaryClassifier salaryClassifier,
                           ObjectMapper mapper) {
        this.props = props;
        this.jobRepository = jobRepository;
        this.salaryNormalizer = salaryNormalizer;
        this.salaryClassifier = salaryClassifier;
        this.mapper = mapper;
        this.http = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .build();
    }

    @Override
    public String sourceName() { return SOURCE; }

    @Override
    @Transactional
    public CrawlResult run() {
        if (!props.remoteok().enabled()) {
            log.info("RemoteOK crawler disabled");
            return CrawlResult.success(SOURCE, 0, 0, 0);
        }

        List<RemoteOkJob> jobs;
        try {
            jobs = fetchJobs();
        } catch (IOException e) {
            log.error("RemoteOK fetch failed: {}", e.getMessage());
            return CrawlResult.failure(SOURCE, e.getMessage());
        }

        int saved = 0, skipped = 0;
        int limit = Math.min(jobs.size(), props.maxJobsPerRun());

        for (int i = 0; i < limit; i++) {
            RemoteOkJob raw = jobs.get(i);
            if (raw.id() == null || raw.title() == null || raw.company() == null) {
                skipped++;
                continue;
            }
            if (jobRepository.existsBySourceAndExternalId(SOURCE, raw.id())) {
                skipped++;
                continue;
            }
            jobRepository.save(toJob(raw));
            saved++;
        }

        log.info("RemoteOK: fetched={} saved={} skipped={}", jobs.size(), saved, skipped);
        return CrawlResult.success(SOURCE, jobs.size(), saved, skipped);
    }

    private List<RemoteOkJob> fetchJobs() throws IOException {
        var request = new Request.Builder()
                .url(props.remoteok().apiUrl())
                .header("User-Agent", props.remoteok().userAgent())
                .header("Accept", "application/json")
                .build();

        try (var response = http.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("HTTP " + response.code());
            }
            String body = response.body().string();
            // API returns array; first element is a legal notice object (has no "id")
            JsonNode root = mapper.readTree(body);
            List<RemoteOkJob> all = new ArrayList<>();
            for (JsonNode node : root) {
                if (node.has("id") && node.has("company")) {
                    all.add(mapper.treeToValue(node, RemoteOkJob.class));
                }
            }
            return all;
        }
    }

    private Job toJob(RemoteOkJob raw) {
        SalaryResult salary = resolveSalary(raw);

        var job = new Job();
        job.setExternalId(raw.id());
        job.setSource(SOURCE);
        job.setTitle(raw.title());
        job.setCompany(raw.company());
        job.setLocation(raw.location() != null ? raw.location() : "Remote");
        job.setRemote(true);
        job.setSalaryMode(salary.mode());
        job.setSalaryMinUsd(salary.minUsd());
        job.setSalaryMaxUsd(salary.maxUsd());
        job.setSalaryRaw(salary.raw());
        job.setJdBody(raw.description());
        job.setApplyUrl(raw.applyUrl() != null ? raw.applyUrl() : raw.url());
        job.setTier(determineTier(raw));
        job.setPostedAt(raw.epoch() != null ? Instant.ofEpochSecond(raw.epoch()) : null);
        return job;
    }

    private SalaryResult resolveSalary(RemoteOkJob raw) {
        // RemoteOK stores explicit USD salaries in salary_min/max fields
        if (raw.salaryMin() != null && raw.salaryMin() > 0) {
            String rawStr = raw.salaryMax() != null
                    ? "$" + raw.salaryMin() + "-$" + raw.salaryMax()
                    : "$" + raw.salaryMin();
            return SalaryResult.explicit(raw.salaryMin(), raw.salaryMax(), rawStr);
        }

        // Fall back to regex extraction from description
        SalaryResult result = salaryNormalizer.normalize(null, raw.description());

        // If regex found non-USD currency and LLM classification is enabled, ask LLM
        if ("non_usd".equals(result.mode()) && props.salary().llmClassifyAmbiguous()) {
            result = salaryClassifier.classify(result.raw(), raw.company(), raw.description());
        }

        return result;
    }

    private int determineTier(RemoteOkJob raw) {
        if (raw.applyUrl() == null) return 3;
        String url = raw.applyUrl().toLowerCase();
        if (url.contains("greenhouse.io") || url.contains("lever.co") || url.contains("workable.com")) {
            return 1;
        }
        return 2;
    }
}
