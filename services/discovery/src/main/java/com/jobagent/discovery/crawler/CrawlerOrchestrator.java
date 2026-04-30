package com.jobagent.discovery.crawler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class CrawlerOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(CrawlerOrchestrator.class);
    private static final int CIRCUIT_OPEN_AFTER = 3;

    private final List<Crawler> crawlers;

    // Per-source consecutive failure counts; reset on success
    private final Map<String, AtomicInteger> failures = new ConcurrentHashMap<>();
    private volatile Instant lastRunAt;
    private volatile List<CrawlResult> lastResults;

    public CrawlerOrchestrator(List<Crawler> crawlers) {
        this.crawlers = crawlers;
    }

    @Scheduled(cron = "${discovery.remoteok.cron:0 0 */6 * * *}")
    public void scheduledRemoteOk() {
        runSource(RemoteOkCrawler.SOURCE);
    }

    @Scheduled(cron = "${discovery.weworkremotely.cron:0 30 */6 * * *}")
    public void scheduledWwr() {
        runSource(WeWorkRemotelyCrawler.SOURCE);
    }

    @Scheduled(cron = "${discovery.hn.cron:0 0 10 * * *}")
    public void scheduledHn() {
        runSource(HnHiringCrawler.SOURCE);
    }

    private void runSource(String sourceName) {
        crawlers.stream()
                .filter(c -> c.sourceName().equals(sourceName))
                .findFirst()
                .ifPresent(c -> {
                    log.info("Scheduled crawl starting, source={}", sourceName);
                    runOne(c);
                });
    }

    /** Called from the REST endpoint for manual/dev triggers. */
    public List<CrawlResult> runAll() {
        lastRunAt = Instant.now();
        lastResults = crawlers.stream().map(this::runOne).toList();
        return lastResults;
    }

    public Instant lastRunAt() { return lastRunAt; }
    public List<CrawlResult> lastResults() { return lastResults; }

    private CrawlResult runOne(Crawler crawler) {
        String src = crawler.sourceName();
        int consecutiveFailures = failures.computeIfAbsent(src, k -> new AtomicInteger(0)).get();

        if (consecutiveFailures >= CIRCUIT_OPEN_AFTER) {
            log.warn("Circuit open for source={}, skipping (failures={})", src, consecutiveFailures);
            return CrawlResult.failure(src, "circuit open after " + consecutiveFailures + " failures");
        }

        try {
            CrawlResult result = crawler.run();
            if (result.isSuccess()) {
                failures.get(src).set(0);
            } else {
                failures.get(src).incrementAndGet();
            }
            return result;
        } catch (Exception e) {
            log.error("Crawler {} threw unexpected exception", src, e);
            failures.computeIfAbsent(src, k -> new AtomicInteger(0)).incrementAndGet();
            return CrawlResult.failure(src, e.getMessage());
        }
    }

    /** Reset circuit for a source (e.g. after operator investigation). */
    public void resetCircuit(String source) {
        failures.getOrDefault(source, new AtomicInteger(0)).set(0);
    }
}
