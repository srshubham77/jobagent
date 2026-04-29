package com.jobagent.profile.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.Map;

public record StoryRequest(
        @NotBlank String title,
        @NotBlank String situation,
        @NotBlank String action,
        @NotBlank String result,
        String metrics,
        List<String> themes,
        Map<String, String> variants,
        String sourceRef
) {}
