package com.jobagent.discovery.crawler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobagent.discovery.config.DiscoveryProperties;
import com.jobagent.discovery.domain.Job;
import com.jobagent.discovery.repository.JobRepository;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class HnHiringCrawler implements Crawler {

    private static final Logger log = LoggerFactory.getLogger(HnHiringCrawler.class);
    public static final String SOURCE = "hn_hiring";

    // Match: "Company | Role | Location | ..."
    private static final Pattern TITLE_PATTERN =
            Pattern.compile("^([^|]+?)\\s*\\|\\s*([^|]+?)(?:\\s*\\|.*)?$");
    // Match "Company (location)" or just "Company"
    private static final Pattern COMPANY_PATTERN =
            Pattern.compile("^(.*?)(?:\\s*\\(([^)]+)\\))?\\s*$");

    private static final String ALGOLIA_THREAD =
            "https://hn.algolia.com/api/v1/search?query=who+is+hiring&tags=ask_hn&hitsPerPage=5";
    private static final String ALGOLIA_COMMENTS =
            "https://hn.algolia.com/api/v1/search?tags=comment,story_%s&hitsPerPage=200&page=%d";

    private final DiscoveryProperties props;
    private final JobRepository jobRepository;
    private final SalaryNormalizer salaryNormalizer;
    private final TitleFilter titleFilter;
    private final ObjectMapper mapper;
    private final OkHttpClient http;

    public HnHiringCrawler(DiscoveryProperties props,
                           JobRepository jobRepository,
                           SalaryNormalizer salaryNormalizer,
                           TitleFilter titleFilter,
                           ObjectMapper mapper) {
        this.props = props;
        this.jobRepository = jobRepository;
        this.salaryNormalizer = salaryNormalizer;
        this.titleFilter = titleFilter;
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
        if (!props.hn().enabled()) {
            log.info("HN Hiring crawler disabled");
            return CrawlResult.success(SOURCE, 0, 0, 0);
        }

        String storyId;
        try {
            storyId = findCurrentHiringThread();
        } catch (IOException e) {
            log.error("HN: failed to find hiring thread: {}", e.getMessage());
            return CrawlResult.failure(SOURCE, e.getMessage());
        }
        if (storyId == null) {
            log.warn("HN: no current hiring thread found");
            return CrawlResult.success(SOURCE, 0, 0, 0);
        }

        List<HnComment> comments;
        try {
            comments = fetchComments(storyId);
        } catch (IOException e) {
            log.error("HN: failed to fetch comments for story {}: {}", storyId, e.getMessage());
            return CrawlResult.failure(SOURCE, e.getMessage());
        }

        int saved = 0, skipped = 0;
        int limit = Math.min(comments.size(), props.maxJobsPerRun());

        for (int i = 0; i < limit; i++) {
            HnComment c = comments.get(i);
            String externalId = storyId + "_" + c.objectId();
            if (jobRepository.existsBySourceAndExternalId(SOURCE, externalId)) {
                skipped++;
                continue;
            }
            Job job = toJob(c, externalId);
            if (job != null && titleFilter.isEngineeringRole(job.getTitle())) {
                jobRepository.save(job);
                saved++;
            } else {
                skipped++;
            }
        }

        log.info("HN: storyId={} fetched={} saved={} skipped={}", storyId, comments.size(), saved, skipped);
        return CrawlResult.success(SOURCE, comments.size(), saved, skipped);
    }

    private String findCurrentHiringThread() throws IOException {
        String body = get(ALGOLIA_THREAD);
        JsonNode root = mapper.readTree(body);
        JsonNode hits = root.path("hits");

        // HN "Who is Hiring" posts are by "whoishiring" account; pick the most recent
        for (JsonNode hit : hits) {
            String author = hit.path("author").asText("");
            String title = hit.path("title").asText("");
            if (author.equals("whoishiring") && title.toLowerCase().contains("who is hiring")) {
                return hit.path("objectID").asText(null);
            }
        }
        // Fallback: just take first result
        if (hits.size() > 0) return hits.get(0).path("objectID").asText(null);
        return null;
    }

    private List<HnComment> fetchComments(String storyId) throws IOException {
        List<HnComment> all = new ArrayList<>();
        int page = 0;
        while (true) {
            String url = String.format(ALGOLIA_COMMENTS, storyId, page);
            String body = get(url);
            JsonNode root = mapper.readTree(body);
            JsonNode hits = root.path("hits");
            if (hits.isEmpty()) break;

            for (JsonNode hit : hits) {
                // Only top-level comments (parent = story) are job postings
                if (!storyId.equals(hit.path("parent_id").asText(null))) continue;
                String objectId = hit.path("objectID").asText(null);
                String text = hit.path("comment_text").asText(null);
                String createdAt = hit.path("created_at").asText(null);
                if (objectId != null && text != null && !text.isBlank()) {
                    all.add(new HnComment(objectId, text, createdAt));
                }
            }

            int nbPages = root.path("nbPages").asInt(1);
            if (++page >= nbPages || page >= 5) break; // cap at 5 pages (1000 comments)
        }
        return all;
    }

    private Job toJob(HnComment comment, String externalId) {
        // Strip HTML tags for plain text
        String plainText = comment.text().replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").strip();
        if (plainText.length() < 20) return null;

        // First line usually: "Company | Role | Location" or "Company (location) | Role"
        String[] lines = plainText.split("[\\n\\r]+", 3);
        String firstLine = lines[0].strip();

        String title = "Software Engineer";
        String company = "Unknown";
        String location = "Remote";

        Matcher m = TITLE_PATTERN.matcher(firstLine);
        if (m.matches()) {
            company = m.group(1).strip();
            title = m.group(2).strip();
        } else if (!firstLine.isBlank()) {
            // Use first line as company, generic title
            company = firstLine.length() > 80 ? firstLine.substring(0, 80) : firstLine;
        }

        // Filter: only remote-friendly postings
        boolean likelyRemote = plainText.toLowerCase().contains("remote");
        if (!likelyRemote) return null;

        SalaryResult salary = salaryNormalizer.normalize(null, plainText);

        Instant postedAt = null;
        if (comment.createdAt() != null) {
            try { postedAt = Instant.parse(comment.createdAt()); } catch (Exception ignored) {}
        }

        String hnUrl = "https://news.ycombinator.com/item?id=" + comment.objectId();

        var job = new Job();
        job.setExternalId(externalId);
        job.setSource(SOURCE);
        job.setTitle(title.length() > 255 ? title.substring(0, 255) : title);
        job.setCompany(company.length() > 255 ? company.substring(0, 255) : company);
        job.setLocation(location);
        job.setRemote(true);
        job.setSalaryMode(salary.mode());
        job.setSalaryMinUsd(salary.minUsd());
        job.setSalaryMaxUsd(salary.maxUsd());
        job.setSalaryRaw(salary.raw());
        job.setJdBody(plainText);
        job.setApplyUrl(hnUrl);
        job.setTier(3); // HN postings always manual
        job.setPostedAt(postedAt);
        return job;
    }

    private String get(String url) throws IOException {
        var request = new Request.Builder()
                .url(url)
                .header("User-Agent", props.hn().userAgent())
                .build();
        try (var response = http.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new IOException("HTTP " + response.code() + " for " + url);
            return response.body().string();
        }
    }

    record HnComment(String objectId, String text, String createdAt) {}
}
