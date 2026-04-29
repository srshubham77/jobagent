package com.jobagent.profile.web;

import com.jobagent.profile.domain.Profile;
import com.jobagent.profile.service.ProfileService;
import com.jobagent.profile.web.dto.ProfileUpsertRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/profiles/me")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ResponseEntity<Profile> getCurrent(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(profileService.getCurrent(userId));
    }

    @GetMapping("/history")
    public ResponseEntity<List<Profile>> getHistory(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(profileService.getHistory(userId));
    }

    @PostMapping("/resume")
    public ResponseEntity<Profile> uploadResume(@CurrentUserId UUID userId,
                                                @RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(profileService.uploadResume(userId, file));
    }

    @PutMapping
    public ResponseEntity<Profile> upsert(@CurrentUserId UUID userId,
                                          @RequestBody ProfileUpsertRequest req) {
        return ResponseEntity.ok(profileService.upsert(userId, req));
    }
}
