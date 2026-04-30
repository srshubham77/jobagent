package com.jobagent.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProfileBootstrapService {
    @Value("${profile-service-url:http://localhost:8081}")
    private String profileServiceUrl;

    private final RestClient restClient;

    @SuppressWarnings("unchecked")
    public String bootstrap(String email) {
        Map<String, Object> response = restClient.post()
            .uri(profileServiceUrl + "/users/bootstrap")
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of("email", email))
            .retrieve()
            .body(Map.class);
        return (String) response.get("id");
    }
}
