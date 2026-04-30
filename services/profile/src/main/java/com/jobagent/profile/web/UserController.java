package com.jobagent.profile.web;

import com.jobagent.profile.domain.User;
import com.jobagent.profile.service.ProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Bootstrap endpoint — creates or retrieves a user by email.
 * Phase 1 auth substitute: the returned user ID is stored client-side
 * and sent as X-User-Id on subsequent requests.
 */
@RestController
@RequestMapping("/users")
public class UserController {

    private final ProfileService profileService;

    public UserController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @PostMapping("/bootstrap")
    public ResponseEntity<Map<String, Object>> bootstrap(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        User user = profileService.getOrCreateUser(email.trim().toLowerCase());
        return ResponseEntity.ok(Map.of("userId", user.getId(), "email", user.getEmail()));
    }
}
