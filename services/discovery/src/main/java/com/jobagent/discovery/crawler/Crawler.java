package com.jobagent.discovery.crawler;

public interface Crawler {
    String sourceName();
    CrawlResult run();
}
