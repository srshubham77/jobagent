package com.jobagent.discovery.salary;

import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Regex-based salary extraction. Handles the common cases; ambiguous/foreign-currency
 * cases are delegated to SalaryClassifier.
 */
@Component
public class SalaryNormalizer {

    private static final int HOURS_PER_YEAR = 2080;

    // Matches: $120k, $120,000, $120K, USD 120k
    private static final String AMT = "(?:[USD\\$]\\s*)?([0-9]{2,3}(?:,[0-9]{3})*)\\s*([kK]?)";
    // Range: $120k-$180k or $120k – $180k
    private static final Pattern USD_RANGE = Pattern.compile(
            "\\$\\s*([0-9]{2,3}(?:,[0-9]{3})*)\\s*([kK]?)\\s*[-–—]\\s*\\$?\\s*([0-9]{2,3}(?:,[0-9]{3})*)\\s*([kK]?)");
    // Single USD amount: $180k, $180,000
    private static final Pattern USD_SINGLE = Pattern.compile(
            "\\$\\s*([0-9]{2,3}(?:,[0-9]{3})*)\\s*([kK]?)(?!\\s*/\\s*(?:hr|hour))");
    // Hourly: $60/hr, $60-80/hr
    private static final Pattern USD_HOURLY_RANGE = Pattern.compile(
            "\\$\\s*([0-9]{2,3})\\s*[-–]\\s*([0-9]{2,3})\\s*/\\s*(?:hr|hour)");
    private static final Pattern USD_HOURLY_SINGLE = Pattern.compile(
            "\\$\\s*([0-9]{2,3})\\s*/\\s*(?:hr|hour)");

    // Non-USD currencies — presence means non_usd (unless LLM says otherwise)
    private static final Pattern NON_USD_CURRENCY = Pattern.compile(
            "[£€₹¥]|\\b(?:GBP|EUR|INR|JPY|CAD|AUD)\\b");

    // Clearly unstated phrases
    private static final Pattern UNSTATED = Pattern.compile(
            "(?i)\\b(?:competitive|doe|negotiable|based on experience|based on location|tbd|TBD|n/a|not specified)\\b");

    public SalaryResult normalize(String salaryRaw, String jdBody) {
        // 1. Try the explicit salary_raw field first (most reliable)
        if (salaryRaw != null && !salaryRaw.isBlank()) {
            SalaryResult r = parseString(salaryRaw);
            if (!"unstated".equals(r.mode())) return r;
        }

        // 2. Scan the JD body for salary mentions
        if (jdBody != null && !jdBody.isBlank()) {
            // Look for the first salary-like sentence
            String candidate = extractSalaryLine(jdBody);
            if (candidate != null) {
                SalaryResult r = parseString(candidate);
                if (!"unstated".equals(r.mode())) return r;
                // Has non-USD currency?
                if (NON_USD_CURRENCY.matcher(candidate).find()) {
                    return SalaryResult.nonUsd(candidate);
                }
            }
        }

        return SalaryResult.unstated();
    }

    /** Parse a single salary string. Returns unstated if nothing matches. */
    public SalaryResult parseString(String s) {
        if (s == null || s.isBlank()) return SalaryResult.unstated();

        // Hourly range first (must precede single USD to avoid partial match)
        Matcher m = USD_HOURLY_RANGE.matcher(s);
        if (m.find()) {
            int lo = Integer.parseInt(m.group(1)) * HOURS_PER_YEAR;
            int hi = Integer.parseInt(m.group(2)) * HOURS_PER_YEAR;
            return SalaryResult.explicit(lo, hi, s.trim());
        }

        m = USD_HOURLY_SINGLE.matcher(s);
        if (m.find()) {
            int annual = Integer.parseInt(m.group(1)) * HOURS_PER_YEAR;
            return SalaryResult.explicit(annual, null, s.trim());
        }

        // Annual range
        m = USD_RANGE.matcher(s);
        if (m.find()) {
            int lo = parseAmount(m.group(1), m.group(2));
            int hi = parseAmount(m.group(3), m.group(4));
            return SalaryResult.explicit(lo, hi, s.trim());
        }

        // Non-USD currencies
        if (NON_USD_CURRENCY.matcher(s).find()) {
            return SalaryResult.nonUsd(s.trim());
        }

        // Single USD amount
        m = USD_SINGLE.matcher(s);
        if (m.find()) {
            int amt = parseAmount(m.group(1), m.group(2));
            // Sanity: amounts under $20k are likely hourly or erroneous; skip
            if (amt >= 20_000) {
                return SalaryResult.explicit(amt, null, s.trim());
            }
        }

        // Clearly unstated
        if (UNSTATED.matcher(s).find()) {
            return SalaryResult.unstated();
        }

        return SalaryResult.unstated();
    }

    private int parseAmount(String digits, String suffix) {
        int base = Integer.parseInt(digits.replace(",", ""));
        return (suffix != null && !suffix.isEmpty()) ? base * 1000 : base;
    }

    private String extractSalaryLine(String body) {
        // Find a line/sentence that contains a $ or currency symbol
        for (String line : body.split("[\n.!]")) {
            if (line.contains("$") || NON_USD_CURRENCY.matcher(line).find()) {
                String trimmed = line.trim();
                if (!trimmed.isEmpty()) return trimmed;
            }
        }
        return null;
    }
}
