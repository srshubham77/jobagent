package com.jobagent.profile.web.dto;

import java.util.List;

public record PreferencesRequest(
        String targetTitle,
        List<String> targetStack,
        Integer minSalary,
        String location,
        Integer autoApplyThreshold,
        Boolean usdOnly,
        Boolean agentEnabled
) {}
