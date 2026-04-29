package com.jobagent.discovery.crawler.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record RemoteOkJob(
        String id,
        Long epoch,
        String url,
        String title,
        String company,
        String location,
        String description,
        @JsonProperty("salary_min") Integer salaryMin,
        @JsonProperty("salary_max") Integer salaryMax,
        @JsonProperty("apply_url") String applyUrl,
        List<String> tags
) {}
