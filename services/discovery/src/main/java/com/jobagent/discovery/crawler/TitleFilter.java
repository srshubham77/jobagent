package com.jobagent.discovery.crawler;

import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Filters job titles to keep only engineering-relevant roles.
 * Blocks non-engineering functions (PM, design, marketing, sales, finance, HR).
 */
@Component
public class TitleFilter {

    private static final Set<String> BLOCKED_TERMS = Set.of(
        // Product / program management
        "product manager", "product owner", "program manager", "project manager",
        "vp of product", "director of product", "head of product", "chief product",
        // Design
        "designer", "ux researcher", "ui/ux", "graphic designer", "visual designer",
        "motion designer", "brand designer", "product designer",
        // Marketing / content / growth
        "marketing manager", "content writer", "copywriter", "seo specialist",
        "social media", "brand manager", "campaign manager", "growth marketer",
        "content strategist", "demand generation", "field marketing",
        // Sales / biz dev
        "sales manager", "sales director", "account executive", "account manager",
        "account director", "business development", "sales representative",
        "sales engineer",
        // Finance / accounting
        "financial analyst", "accountant", "accounting manager", "controller",
        "finance manager", "cfo", "treasury", "bookkeeper", "tax analyst",
        // HR / talent
        "recruiter", "talent acquisition", "talent partner", "hr manager",
        "human resources", "people operations", "people partner", "hr business partner",
        // Legal
        "legal counsel", "attorney", "paralegal", "compliance manager", "general counsel",
        // Operations (non-engineering)
        "operations manager", "office manager", "executive assistant",
        "chief of staff", "administrative",
        // Analytics (non-engineering BA roles)
        "business analyst", "bi analyst",
        // Developer advocacy
        "developer advocate", "developer relations", "devrel manager",
        // Technical writing
        "technical writer", "technical communication",
        // Customer success / support
        "customer success manager", "customer support", "client success",
        "customer experience manager"
    );

    /**
     * Returns true when the title does NOT match any blocked term.
     * Case-insensitive substring match — false positives (e.g. "sales engineer")
     * are intentionally dropped to keep the feed clean.
     */
    public boolean isEngineeringRole(String title) {
        if (title == null || title.isBlank()) return false;
        String lower = title.toLowerCase();
        return BLOCKED_TERMS.stream().noneMatch(lower::contains);
    }
}
