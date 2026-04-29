package com.jobagent.profile.service;

import com.jobagent.profile.domain.Profile;
import com.jobagent.profile.domain.User;
import com.jobagent.profile.repository.ProfileRepository;
import com.jobagent.profile.repository.UserRepository;
import com.jobagent.profile.web.dto.ProfileUpsertRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final ResumeParserService resumeParserService;

    public ProfileService(ProfileRepository profileRepository,
                          UserRepository userRepository,
                          ResumeParserService resumeParserService) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
        this.resumeParserService = resumeParserService;
    }

    @Transactional(readOnly = true)
    public Profile getCurrent(UUID userId) {
        return profileRepository.findByUserIdAndIsCurrentTrue(userId)
                .orElseThrow(() -> new NoSuchElementException("No profile found for user " + userId));
    }

    @Transactional(readOnly = true)
    public List<Profile> getHistory(UUID userId) {
        return profileRepository.findByUserIdOrderByVersionNumberDesc(userId);
    }

    @Transactional
    public Profile uploadResume(UUID userId, MultipartFile file) throws IOException {
        var parsed = resumeParserService.parse(file.getInputStream(), file.getOriginalFilename());

        var req = new ProfileUpsertRequest(
                parsed.contact(),
                parsed.summary(),
                parsed.experience(),
                parsed.education(),
                parsed.skills(),
                parsed.projects(),
                parsed.certifications()
        );

        return createNewVersion(userId, req, parsed.rawText());
    }

    @Transactional
    public Profile upsert(UUID userId, ProfileUpsertRequest req) {
        return createNewVersion(userId, req, null);
    }

    private Profile createNewVersion(UUID userId, ProfileUpsertRequest req, String rawText) {
        // Pessimistic lock on the user row to prevent concurrent version creation
        userRepository.findByIdForUpdate(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));

        profileRepository.clearCurrent(userId);

        int nextVersion = profileRepository.maxVersionNumber(userId) + 1;

        var profile = new Profile();
        profile.setUserId(userId);
        profile.setVersionNumber(nextVersion);
        profile.setCurrent(true);
        profile.setContact(req.contact());
        profile.setSummary(req.summary());
        profile.setExperience(req.experience());
        profile.setEducation(req.education());
        profile.setSkills(req.skills());
        profile.setProjects(req.projects());
        profile.setCertifications(req.certifications());
        profile.setRawText(rawText);

        return profileRepository.saveAndFlush(profile);
    }

    @Transactional
    public User getOrCreateUser(String email) {
        return userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.save(new User(email)));
    }
}
