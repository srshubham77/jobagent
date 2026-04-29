package com.jobagent.profile.web.dto;

import com.jobagent.profile.domain.EducationEntry;
import com.jobagent.profile.domain.ExperienceEntry;

import java.util.List;
import java.util.Map;

public record ProfileUpsertRequest(
        Map<String, Object> contact,
        String summary,
        List<ExperienceEntry> experience,
        List<EducationEntry> education,
        List<String> skills,
        List<Map<String, Object>> projects,
        List<String> certifications
) {}
