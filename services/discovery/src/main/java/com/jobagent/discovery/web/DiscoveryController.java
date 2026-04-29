package com.jobagent.discovery.web;

import com.jobagent.discovery.crawler.CrawlResult;
import com.jobagent.discovery.crawler.CrawlerOrchestrator;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/crawl")
public class DiscoveryController {

    private final CrawlerOrchestrator orchestrator;

    public DiscoveryController(CrawlerOrchestrator orchestrator) {
        this.orchestrator = orchestrator;
    }

    @PostMapping("/trigger")
    public ResponseEntity<List<CrawlResult>> trigger() {
        return ResponseEntity.ok(orchestrator.runAll());
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        Instant lastRun = orchestrator.lastRunAt();
        return ResponseEntity.ok(Map.of(
                "lastRunAt", lastRun != null ? lastRun.toString() : "never",
                "lastResults", orchestrator.lastResults() != null ? orchestrator.lastResults() : List.of()
        ));
    }

    @PostMapping("/circuit/{source}/reset")
    public ResponseEntity<Void> resetCircuit(@PathVariable String source) {
        orchestrator.resetCircuit(source);
        return ResponseEntity.noContent().build();
    }
}
