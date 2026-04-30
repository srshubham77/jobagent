package com.jobagent.tracker.gmail;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobagent.tracker.config.TrackerProperties;
import com.jobagent.tracker.crypto.TokenCrypto;
import com.jobagent.tracker.domain.OAuthToken;
import com.jobagent.tracker.repository.OAuthTokenRepository;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class GmailOAuthService {

    private static final Logger log = LoggerFactory.getLogger(GmailOAuthService.class);
    public static final String PROVIDER = "gmail";

    private static final String AUTH_URL    = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String TOKEN_URL   = "https://oauth2.googleapis.com/token";
    private static final String SCOPES      = "https://www.googleapis.com/auth/gmail.readonly";
    // Buffer: refresh if token expires in less than 5 minutes
    private static final long EXPIRY_BUFFER_SECS = 300;

    private final TrackerProperties props;
    private final OAuthTokenRepository tokenRepo;
    private final TokenCrypto crypto;
    private final ObjectMapper mapper;
    private final OkHttpClient http;

    public GmailOAuthService(TrackerProperties props,
                             OAuthTokenRepository tokenRepo,
                             TokenCrypto crypto,
                             ObjectMapper mapper) {
        this.props = props;
        this.tokenRepo = tokenRepo;
        this.crypto = crypto;
        this.mapper = mapper;
        this.http = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(15, TimeUnit.SECONDS)
                .build();
    }

    /** Build the Google OAuth consent URL. state = userId so we can store the token on callback. */
    public String buildAuthUrl(UUID userId) {
        TrackerProperties.GmailProperties g = props.gmail();
        return AUTH_URL
                + "?client_id=" + encode(g.clientId())
                + "&redirect_uri=" + encode(g.redirectUri())
                + "&response_type=code"
                + "&scope=" + encode(SCOPES)
                + "&access_type=offline"
                + "&prompt=consent"
                + "&state=" + userId;
    }

    /** Exchange the auth code for tokens and persist them encrypted. */
    @Transactional
    public void handleCallback(String code, UUID userId) throws IOException {
        TrackerProperties.GmailProperties g = props.gmail();
        RequestBody body = new FormBody.Builder()
                .add("code", code)
                .add("client_id", g.clientId())
                .add("client_secret", g.clientSecret())
                .add("redirect_uri", g.redirectUri())
                .add("grant_type", "authorization_code")
                .build();

        JsonNode resp = postForm(TOKEN_URL, body);
        storeTokens(userId, resp);
        log.info("Gmail OAuth connected for userId={}", userId);
    }

    /** Returns a valid (possibly refreshed) access token for the user. */
    public Optional<String> getAccessToken(UUID userId) {
        return tokenRepo.findByUserIdAndProvider(userId, PROVIDER).map(token -> {
            if (isExpired(token)) {
                try {
                    token = refresh(token);
                } catch (IOException e) {
                    log.error("Token refresh failed for userId={}: {}", userId, e.getMessage());
                    return null;
                }
            }
            return crypto.decrypt(token.getAccessTokenEnc());
        });
    }

    public boolean isConnected(UUID userId) {
        return tokenRepo.findByUserIdAndProvider(userId, PROVIDER).isPresent();
    }

    @Transactional
    public void disconnect(UUID userId) {
        tokenRepo.findByUserIdAndProvider(userId, PROVIDER).ifPresent(tokenRepo::delete);
        log.info("Gmail OAuth disconnected for userId={}", userId);
    }

    // ── private ──────────────────────────────────────────────────────────────

    private boolean isExpired(OAuthToken token) {
        return token.getExpiresAt() != null
                && Instant.now().isAfter(token.getExpiresAt().minusSeconds(EXPIRY_BUFFER_SECS));
    }

    @Transactional
    OAuthToken refresh(OAuthToken token) throws IOException {
        TrackerProperties.GmailProperties g = props.gmail();
        String refreshToken = crypto.decrypt(token.getRefreshTokenEnc());

        RequestBody body = new FormBody.Builder()
                .add("client_id", g.clientId())
                .add("client_secret", g.clientSecret())
                .add("refresh_token", refreshToken)
                .add("grant_type", "refresh_token")
                .build();

        JsonNode resp = postForm(TOKEN_URL, body);
        token.setAccessTokenEnc(crypto.encrypt(resp.path("access_token").asText()));
        if (resp.has("expires_in")) {
            token.setExpiresAt(Instant.now().plusSeconds(resp.path("expires_in").asLong()));
        }
        // Google only returns a new refresh token on first auth; keep existing one
        return tokenRepo.save(token);
    }

    @Transactional
    void storeTokens(UUID userId, JsonNode resp) {
        OAuthToken token = tokenRepo.findByUserIdAndProvider(userId, PROVIDER)
                .orElseGet(() -> {
                    OAuthToken t = new OAuthToken();
                    t.setUserId(userId);
                    t.setProvider(PROVIDER);
                    return t;
                });

        token.setAccessTokenEnc(crypto.encrypt(resp.path("access_token").asText()));
        String refresh = resp.path("refresh_token").asText("");
        if (!refresh.isBlank()) {
            token.setRefreshTokenEnc(crypto.encrypt(refresh));
        }
        if (resp.has("expires_in")) {
            token.setExpiresAt(Instant.now().plusSeconds(resp.path("expires_in").asLong()));
        }
        token.setScope(resp.path("scope").asText(null));
        tokenRepo.save(token);
    }

    private JsonNode postForm(String url, RequestBody body) throws IOException {
        Request request = new Request.Builder().url(url).post(body).build();
        try (Response response = http.newCall(request).execute()) {
            String responseBody = response.body().string();
            if (!response.isSuccessful()) {
                throw new IOException("OAuth token exchange failed HTTP " + response.code() + ": " + responseBody);
            }
            return mapper.readTree(responseBody);
        }
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
