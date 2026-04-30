package com.jobagent.profile.web;

import com.jobagent.profile.domain.UserPreferences;
import com.jobagent.profile.repository.UserPreferencesRepository;
import com.jobagent.profile.web.dto.PreferencesRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/preferences")
public class PreferencesController {

    private final UserPreferencesRepository prefsRepository;

    public PreferencesController(UserPreferencesRepository prefsRepository) {
        this.prefsRepository = prefsRepository;
    }

    @GetMapping
    public ResponseEntity<UserPreferences> get(@CurrentUserId UUID userId) {
        return ResponseEntity.ok(
                prefsRepository.findByUserId(userId)
                        .orElseGet(() -> UserPreferences.defaults(userId))
        );
    }

    @PutMapping
    @Transactional
    public ResponseEntity<UserPreferences> upsert(@CurrentUserId UUID userId,
                                                   @RequestBody PreferencesRequest req) {
        UserPreferences prefs = prefsRepository.findByUserId(userId)
                .orElseGet(() -> UserPreferences.defaults(userId));

        if (req.targetTitle()         != null) prefs.setTargetTitle(req.targetTitle());
        if (req.targetStack()         != null) prefs.setTargetStack(req.targetStack());
        if (req.minSalary()           != null) prefs.setMinSalary(req.minSalary());
        if (req.location()            != null) prefs.setLocation(req.location());
        if (req.autoApplyThreshold()  != null) prefs.setAutoApplyThreshold(req.autoApplyThreshold());
        if (req.usdOnly()             != null) prefs.setUsdOnly(req.usdOnly());
        if (req.agentEnabled()        != null) prefs.setAgentEnabled(req.agentEnabled());

        return ResponseEntity.ok(prefsRepository.save(prefs));
    }
}
