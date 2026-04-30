package com.jobagent.discovery.crawler;

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
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Component
public class WeWorkRemotelyCrawler implements Crawler {

    private static final Logger log = LoggerFactory.getLogger(WeWorkRemotelyCrawler.class);
    public static final String SOURCE = "weworkremotely";

    private static final DateTimeFormatter RFC_822 =
            DateTimeFormatter.ofPattern("EEE, dd MMM yyyy HH:mm:ss Z");

    private final DiscoveryProperties props;
    private final JobRepository jobRepository;
    private final SalaryNormalizer salaryNormalizer;
    private final TitleFilter titleFilter;
    private final OkHttpClient http;

    public WeWorkRemotelyCrawler(DiscoveryProperties props,
                                 JobRepository jobRepository,
                                 SalaryNormalizer salaryNormalizer,
                                 TitleFilter titleFilter) {
        this.props = props;
        this.jobRepository = jobRepository;
        this.salaryNormalizer = salaryNormalizer;
        this.titleFilter = titleFilter;
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
        if (!props.weworkremotely().enabled()) {
            log.info("WeWorkRemotely crawler disabled");
            return CrawlResult.success(SOURCE, 0, 0, 0);
        }

        List<WwrItem> items;
        try {
            items = fetchItems();
        } catch (Exception e) {
            log.error("WWR fetch failed: {}", e.getMessage());
            return CrawlResult.failure(SOURCE, e.getMessage());
        }

        int saved = 0, skipped = 0;
        int limit = Math.min(items.size(), props.maxJobsPerRun());

        for (int i = 0; i < limit; i++) {
            WwrItem item = items.get(i);
            if (!titleFilter.isEngineeringRole(item.title())) {
                skipped++;
                continue;
            }
            if (jobRepository.existsBySourceAndExternalId(SOURCE, item.externalId())) {
                skipped++;
                continue;
            }
            jobRepository.save(toJob(item));
            saved++;
        }

        log.info("WWR: fetched={} saved={} skipped={}", items.size(), saved, skipped);
        return CrawlResult.success(SOURCE, items.size(), saved, skipped);
    }

    private List<WwrItem> fetchItems() throws Exception {
        var request = new Request.Builder()
                .url(props.weworkremotely().feedUrl())
                .header("User-Agent", props.weworkremotely().userAgent())
                .build();

        String xml;
        try (var response = http.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new Exception("HTTP " + response.code());
            xml = response.body().string();
        }

        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        // Prevent XXE
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        Document doc = factory.newDocumentBuilder().parse(new InputSource(new StringReader(xml)));

        NodeList nodes = doc.getElementsByTagName("item");
        List<WwrItem> results = new ArrayList<>();
        for (int i = 0; i < nodes.getLength(); i++) {
            Element el = (Element) nodes.item(i);
            parseItem(el).ifPresent(results::add);
        }
        return results;
    }

    private java.util.Optional<WwrItem> parseItem(Element el) {
        String link = text(el, "link");
        if (link == null) return java.util.Optional.empty();

        // Extract ID from URL: last path segment before any query string
        String[] parts = link.split("/");
        String externalId = parts[parts.length - 1].split("\\?")[0];
        if (externalId.isBlank()) return java.util.Optional.empty();

        // Title format: "Company: Job Title"
        String rawTitle = text(el, "title");
        if (rawTitle == null) return java.util.Optional.empty();
        String company = rawTitle;
        String title = rawTitle;
        int colonIdx = rawTitle.indexOf(": ");
        if (colonIdx > 0) {
            company = rawTitle.substring(0, colonIdx).trim();
            title = rawTitle.substring(colonIdx + 2).trim();
        }

        String description = text(el, "description");
        String pubDate = text(el, "pubDate");
        String region = text(el, "region");

        Instant postedAt = null;
        if (pubDate != null) {
            try {
                postedAt = ZonedDateTime.parse(pubDate.trim(), RFC_822).toInstant();
            } catch (Exception ignored) {}
        }

        return java.util.Optional.of(new WwrItem(externalId, title, company, link, description, region, postedAt));
    }

    private String text(Element el, String tag) {
        NodeList nl = el.getElementsByTagName(tag);
        if (nl.getLength() == 0) return null;
        String content = nl.item(0).getTextContent();
        return content == null || content.isBlank() ? null : content.strip();
    }

    private Job toJob(WwrItem item) {
        SalaryResult salary = salaryNormalizer.normalize(null, item.description());
        int tier = determineTier(item.link());

        var job = new Job();
        job.setExternalId(item.externalId());
        job.setSource(SOURCE);
        job.setTitle(item.title());
        job.setCompany(item.company());
        job.setLocation(item.region() != null ? item.region() : "Remote");
        job.setRemote(true);
        job.setSalaryMode(salary.mode());
        job.setSalaryMinUsd(salary.minUsd());
        job.setSalaryMaxUsd(salary.maxUsd());
        job.setSalaryRaw(salary.raw());
        job.setJdBody(item.description());
        job.setApplyUrl(item.link());
        job.setTier(tier);
        job.setPostedAt(item.postedAt());
        return job;
    }

    private int determineTier(String url) {
        if (url == null) return 3;
        String u = url.toLowerCase();
        if (u.contains("greenhouse.io") || u.contains("lever.co") || u.contains("workable.com")) return 1;
        return 2;
    }

    record WwrItem(String externalId, String title, String company, String link,
                   String description, String region, Instant postedAt) {}
}
