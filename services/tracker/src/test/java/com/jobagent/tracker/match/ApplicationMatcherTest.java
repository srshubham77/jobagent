package com.jobagent.tracker.match;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class ApplicationMatcherTest {

    @ParameterizedTest
    @CsvSource({
        "recruiter@stripe.com,           stripe.com",
        "hiring@boards.greenhouse.io,    greenhouse.io",
        "person@mail.lever.co,           lever.co",
    })
    void extractsDomainFromEmail(String email, String expected) {
        assertThat(ApplicationMatcher.extractDomain(email)).isEqualTo(expected);
    }

    @ParameterizedTest
    @CsvSource({
        "https://boards.greenhouse.io/stripe/jobs/123, greenhouse.io",
        "https://jobs.lever.co/acme/abc-123,           lever.co",
        "https://stripe.com/careers/apply,             stripe.com",
    })
    void extractsDomainFromUrl(String url, String expected) {
        assertThat(ApplicationMatcher.extractDomain(url)).isEqualTo(expected);
    }

    @ParameterizedTest
    @CsvSource({
        "stripe.com, stripe.com,    true",
        "mail.stripe.com, stripe.com, true",
        "acme.com, stripe.com,      false",
        "stripetest.com, stripe.com, false",
    })
    void rootDomainMatching(String senderDomain, String companyDomain, boolean expected) {
        boolean result = senderDomain.endsWith(companyDomain);
        assertThat(result).isEqualTo(expected);
    }

    @ParameterizedTest
    @CsvSource({
        "We received your application to Stripe, stripe, true",
        "Congratulations from Acme Corp, acme corp, true",
        "Hello from Google, microsoft, false",
        "null, stripe, false",
    })
    void companyNameDetection(String text, String company, boolean expected) {
        String input = "null".equals(text) ? null : text;
        assertThat(ApplicationMatcher.contains(input, company)).isEqualTo(expected);
    }
}
