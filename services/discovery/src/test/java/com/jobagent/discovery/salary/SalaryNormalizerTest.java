package com.jobagent.discovery.salary;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class SalaryNormalizerTest {

    private final SalaryNormalizer normalizer = new SalaryNormalizer();

    @ParameterizedTest(name = "{0} → mode={1} min={2} max={3}")
    @CsvSource({
            "$120k-$180k,        usd_explicit, 120000, 180000",
            "'$120,000-$180,000', usd_explicit, 120000, 180000",
            "$180k,              usd_explicit, 180000,       ",
            "$60/hr,             usd_explicit, 124800,       ",
            "$60-80/hr,          usd_explicit, 124800, 166400",
            "£90k,               non_usd,            ,       ",
            "€120k,              non_usd,            ,       ",
            "competitive,        unstated,           ,       ",
            "DOE,                unstated,           ,       ",
    })
    void parsesCommonSalaryStrings(String input, String expectedMode,
                                   String expectedMin, String expectedMax) {
        SalaryResult r = normalizer.parseString(input.trim());
        assertThat(r.mode()).isEqualTo(expectedMode);

        if (expectedMin != null && !expectedMin.isBlank()) {
            assertThat(r.minUsd()).isEqualTo(Integer.parseInt(expectedMin.trim()));
        } else {
            assertThat(r.minUsd()).isNull();
        }
        if (expectedMax != null && !expectedMax.isBlank()) {
            assertThat(r.maxUsd()).isEqualTo(Integer.parseInt(expectedMax.trim()));
        } else {
            assertThat(r.maxUsd()).isNull();
        }
    }

    @Test
    void fallsBackToJdBodyWhenSalaryRawIsNull() {
        String jd = "We pay $150,000-$200,000 annually. You will work remotely.";
        SalaryResult r = normalizer.normalize(null, jd);
        assertThat(r.mode()).isEqualTo("usd_explicit");
        assertThat(r.minUsd()).isEqualTo(150_000);
        assertThat(r.maxUsd()).isEqualTo(200_000);
    }

    @Test
    void returnsUnstatedWhenNoSalaryInfo() {
        SalaryResult r = normalizer.normalize(null, "Great opportunity to join our team.");
        assertThat(r.mode()).isEqualTo("unstated");
        assertThat(r.minUsd()).isNull();
    }

    @Test
    void salaryRawTakesPrecedenceOverJdBody() {
        SalaryResult r = normalizer.normalize("$200k", "We pay £90k.");
        assertThat(r.mode()).isEqualTo("usd_explicit");
        assertThat(r.minUsd()).isEqualTo(200_000);
    }
}
