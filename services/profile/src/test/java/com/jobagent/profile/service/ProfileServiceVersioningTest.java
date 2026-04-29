package com.jobagent.profile.service;

import com.jobagent.profile.AbstractIntegrationTest;
import com.jobagent.profile.domain.User;
import com.jobagent.profile.repository.UserRepository;
import com.jobagent.profile.web.dto.ProfileUpsertRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProfileServiceVersioningTest extends AbstractIntegrationTest {

    @Autowired ProfileService profileService;
    @Autowired UserRepository userRepository;

    private User user;

    @BeforeEach
    void setup() {
        user = userRepository.save(new User("versioning-test-" + System.nanoTime() + "@example.com"));
    }

    private ProfileUpsertRequest buildRequest(String summary) {
        return new ProfileUpsertRequest(
                Map.of("name", "Test User"),
                summary,
                List.of(),
                List.of(),
                List.of("Java", "Spring"),
                List.of(),
                List.of()
        );
    }

    @Test
    void firstUpsertCreatesVersionOne() {
        var profile = profileService.upsert(user.getId(), buildRequest("v1 summary"));

        assertThat(profile.getVersionNumber()).isEqualTo(1);
        assertThat(profile.isCurrent()).isTrue();
    }

    @Test
    void secondUpsertCreatesVersionTwo() {
        profileService.upsert(user.getId(), buildRequest("v1 summary"));
        var v2 = profileService.upsert(user.getId(), buildRequest("v2 summary"));

        assertThat(v2.getVersionNumber()).isEqualTo(2);
        assertThat(v2.isCurrent()).isTrue();
    }

    @Test
    void onlyOneCurrentProfileExists() {
        profileService.upsert(user.getId(), buildRequest("v1"));
        profileService.upsert(user.getId(), buildRequest("v2"));
        profileService.upsert(user.getId(), buildRequest("v3"));

        var current = profileService.getCurrent(user.getId());
        assertThat(current.getVersionNumber()).isEqualTo(3);
        assertThat(current.getSummary()).isEqualTo("v3");
    }

    @Test
    void historyRetainsAllVersions() {
        profileService.upsert(user.getId(), buildRequest("v1"));
        profileService.upsert(user.getId(), buildRequest("v2"));

        var history = profileService.getHistory(user.getId());
        assertThat(history).hasSize(2);
        assertThat(history.get(0).getVersionNumber()).isEqualTo(2);
        assertThat(history.get(1).getVersionNumber()).isEqualTo(1);
    }

    @Test
    void getThrowsWhenNoProfile() {
        var newUser = userRepository.save(new User("no-profile-" + System.nanoTime() + "@example.com"));

        assertThatThrownBy(() -> profileService.getCurrent(newUser.getId()))
                .isInstanceOf(java.util.NoSuchElementException.class);
    }
}
