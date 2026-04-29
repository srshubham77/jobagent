package com.jobagent.profile.domain;

public record EducationEntry(
        String institution,
        String degree,
        String field,
        String graduationDate
) {}
