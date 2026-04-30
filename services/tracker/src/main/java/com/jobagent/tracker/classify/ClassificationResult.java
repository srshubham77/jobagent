package com.jobagent.tracker.classify;

public record ClassificationResult(String classification, double confidence) {

    public static ClassificationResult irrelevant() {
        return new ClassificationResult("irrelevant", 1.0);
    }

    public static ClassificationResult fallback(String classification) {
        return new ClassificationResult(classification, 0.5);
    }
}
