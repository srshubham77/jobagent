package com.jobagent.tracker.classify;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class EmailClassifierTest {

    private final EmailClassifier classifier = new EmailClassifier(null, new ObjectMapper());

    @ParameterizedTest
    @CsvSource({
        "ack,              0.9,  ack,               0.9",
        "recruiter_contact, 0.85, recruiter_contact, 0.85",
        "interview_scheduling, 0.95, interview_scheduling, 0.95",
        "rejection,        0.8,  rejection,         0.8",
        "offer,            0.99, offer,              0.99",
        "irrelevant,       0.7,  irrelevant,         0.7",
    })
    void parsesValidJson(String label, double confidence, String expectedLabel, double expectedConf) {
        String json = String.format("{\"classification\":\"%s\",\"confidence\":%.2f}", label, confidence);
        ClassificationResult result = classifier.parse(json);
        assertThat(result.classification()).isEqualTo(expectedLabel);
        assertThat(result.confidence()).isEqualTo(expectedConf);
    }

    @ParameterizedTest
    @CsvSource({
        "unknown_label",
        "REJECTION",
        "not_a_label",
    })
    void invalidClassificationDefaultsToIrrelevant(String label) {
        String json = String.format("{\"classification\":\"%s\",\"confidence\":0.9}", label);
        ClassificationResult result = classifier.parse(json);
        assertThat(result.classification()).isEqualTo("irrelevant");
    }

    @ParameterizedTest
    @CsvSource({
        "noreply@stripe.com",
        "no-reply@greenhouse.io",
        "newsletter@company.com",
        "notifications@linkedin.com",
    })
    void knownSpamSenderShortCircuits(String sender) {
        ClassificationResult result = classifier.classify(sender, "We received your application", "Thanks...");
        assertThat(result.classification()).isEqualTo("irrelevant");
    }

    @ParameterizedTest
    @CsvSource({
        "recruiter@stripe.com, 'We saw your application', 'Hi, I am a recruiter at Stripe'",
        "hiring@acme.co, 'Interview invitation', 'We would like to schedule a call'",
    })
    void buildPromptIncludesAllFields(String sender, String subject, String snippet) {
        String prompt = classifier.buildPrompt(sender, subject, snippet);
        assertThat(prompt).contains(sender).contains(subject).contains(snippet);
    }
}
