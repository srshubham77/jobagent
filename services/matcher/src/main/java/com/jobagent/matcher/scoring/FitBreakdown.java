package com.jobagent.matcher.scoring;

import java.util.List;

public record FitBreakdown(
        int skillOverlap,
        int seniorityMatch,
        int salaryFit,
        int recency,
        int composite,
        List<String> skillsMatched,
        List<String> skillsMissing,
        String seniorityGap,
        String salaryNote
) {}
