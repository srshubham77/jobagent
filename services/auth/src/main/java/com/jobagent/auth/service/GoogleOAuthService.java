package com.jobagent.auth.service;

import com.jobagent.auth.config.AuthProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class GoogleOAuthService {
    private static final String AUTH_ENDPOINT   = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String TOKEN_ENDPOINT  = "https://oauth2.googleapis.com/token";
    private static final String USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";

    private final AuthProperties props;
    private final RestClient restClient;

    public String buildAuthUrl(String redirectUri, String state) {
        return UriComponentsBuilder.fromUriString(AUTH_ENDPOINT)
            .queryParam("client_id",     props.google().clientId())
            .queryParam("redirect_uri",  redirectUri)
            .queryParam("response_type", "code")
            .queryParam("scope",         "openid email profile")
            .queryParam("state",         state)
            .queryParam("access_type",   "offline")
            .build()
            .toUriString();
    }

    @SuppressWarnings("unchecked")
    public GoogleUserInfo exchangeCode(String code, String redirectUri) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("code",          code);
        form.add("client_id",     props.google().clientId());
        form.add("client_secret", props.google().clientSecret());
        form.add("redirect_uri",  redirectUri);
        form.add("grant_type",    "authorization_code");

        Map<String, Object> tokenResponse = restClient.post()
            .uri(TOKEN_ENDPOINT)
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(form)
            .retrieve()
            .body(Map.class);

        String googleAccessToken = (String) tokenResponse.get("access_token");

        Map<String, Object> userInfo = restClient.get()
            .uri(USERINFO_ENDPOINT)
            .header("Authorization", "Bearer " + googleAccessToken)
            .retrieve()
            .body(Map.class);

        return new GoogleUserInfo(
            (String) userInfo.get("sub"),
            (String) userInfo.get("email"),
            (String) userInfo.get("name"),
            (String) userInfo.get("picture")
        );
    }

    public record GoogleUserInfo(String sub, String email, String name, String picture) {}
}
