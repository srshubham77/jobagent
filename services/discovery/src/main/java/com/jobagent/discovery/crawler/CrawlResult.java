package com.jobagent.discovery.crawler;

public record CrawlResult(
        String source,
        int fetched,
        int saved,
        int skipped,
        String errorMessage
) {
    public static CrawlResult success(String source, int fetched, int saved, int skipped) {
        return new CrawlResult(source, fetched, saved, skipped, null);
    }

    public static CrawlResult failure(String source, String error) {
        return new CrawlResult(source, 0, 0, 0, error);
    }

    public boolean isSuccess() { return errorMessage == null; }
}
