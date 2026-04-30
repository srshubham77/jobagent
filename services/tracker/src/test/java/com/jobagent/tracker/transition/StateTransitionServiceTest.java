package com.jobagent.tracker.transition;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class StateTransitionServiceTest {

    @ParameterizedTest(name = "{0} + {1} → {2} (tag={3})")
    @CsvSource({
        "applied, recruiter_contact,      active,  null",
        "applied, interview_scheduling,   active,  null",
        "applied, rejection,              closed,  rejected",
        "applied, offer,                  closed,  offer",
        "active,  rejection,              closed,  rejected",
        "active,  offer,                  closed,  offer",
        "active,  recruiter_contact,      null,    null",   // already active, no transition
        "active,  interview_scheduling,   null,    null",   // already active, no transition
        "applied, ack,                    null,    null",
        "applied, irrelevant,             null,    null",
        "closed,  rejection,              null,    null",   // state regression prevented
    })
    void computesCorrectTransition(String status, String classification, String expectedStatus, String expectedTag) {
        String[] result = StateTransitionService.computeNext(status, classification);

        if ("null".equals(expectedStatus)) {
            assertThat(result).isNull();
        } else {
            assertThat(result).isNotNull();
            assertThat(result[0]).isEqualTo(expectedStatus);
            String tag = result[1];
            if ("null".equals(expectedTag)) {
                assertThat(tag).isNull();
            } else {
                assertThat(tag).isEqualTo(expectedTag);
            }
        }
    }
}
