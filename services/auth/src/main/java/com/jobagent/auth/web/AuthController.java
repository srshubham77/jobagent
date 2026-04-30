package com.jobagent.auth.web;

import com.jobagent.auth.config.AuthProperties;
import com.jobagent.auth.service.*;
import com.jobagent.auth.web.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final GoogleOAuthService googleOAuth;
    private final TokenService tokenService;
    private final RefreshTokenStore refreshTokenStore;
    private final StateStore stateStore;
    private final ProfileBootstrapService profileBootstrap;
    private final AuthProperties props;

    /** Step 1 — returns the Google OAuth URL the browser should navigate to. */
    @GetMapping("/google-url")
    public Map<String, String> googleUrl(@RequestParam String callbackUrl) {
        String state = stateStore.generate();
        return Map.of("url", googleOAuth.buildAuthUrl(callbackUrl, state), "state", state);
    }

    /** Step 2 — Next.js calls this after receiving the Google auth code. */
    @PostMapping("/exchange")
    public TokenResponse exchange(@RequestBody ExchangeRequest req) {
        if (!stateStore.consume(req.state())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired state");
        }
        var userInfo = googleOAuth.exchangeCode(req.code(), req.redirectUri());
        String userId = profileBootstrap.bootstrap(userInfo.email());

        String accessToken  = tokenService.issueAccessToken(userId, userInfo.email(), userInfo.name());
        String refreshToken = refreshTokenStore.create(new RefreshTokenStore.Entry(userId, userInfo.email(), userInfo.name()));
        return new TokenResponse(accessToken, refreshToken, props.jwt().accessTokenTtlSeconds());
    }

    /** Rotate refresh token, issue new access token. */
    @PostMapping("/refresh")
    public TokenResponse refresh(@RequestBody RefreshRequest req) {
        var entry = refreshTokenStore.get(req.refreshToken())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        refreshTokenStore.revoke(req.refreshToken());
        String accessToken     = tokenService.issueAccessToken(entry.userId(), entry.email(), entry.name());
        String newRefreshToken = refreshTokenStore.create(entry);
        return new TokenResponse(accessToken, newRefreshToken, props.jwt().accessTokenTtlSeconds());
    }

    /** Invalidate refresh token on logout. */
    @DeleteMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestBody RefreshRequest req) {
        refreshTokenStore.revoke(req.refreshToken());
    }

    /** Public JWKS endpoint — Next.js and backend services use this to verify JWTs. */
    @GetMapping("/jwks")
    public Map<String, Object> jwks() {
        return tokenService.getJwks();
    }
}
