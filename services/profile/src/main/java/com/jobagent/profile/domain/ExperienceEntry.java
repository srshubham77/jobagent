package com.jobagent.profile.domain;

import java.util.List;

public record ExperienceEntry(
        String company,
        String title,
        String startDate,
        String endDate,
        String location,
        List<String> bullets
) {}
