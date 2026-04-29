package com.jobagent.matcher.scoring;

import org.springframework.stereotype.Component;

/**
 * Scores how well the job's salary range meets the candidate's minimum target.
 *
 * "unstated" jobs return 50 (neutral) — we don't penalise them since they might
 * negotiate. "non_usd" returns 30 (soft penalty — might be usd_implied).
 */
@Component
public class SalaryFitScorer {

    public record Result(int score, String note) {}

    public Result score(String salaryMode, Integer salaryMinUsd, Integer salaryMaxUsd,
                        Integer candidateMinSalary) {
        if (candidateMinSalary == null || candidateMinSalary <= 0) {
            return new Result(50, "no target set");
        }

        return switch (salaryMode) {
            case "usd_explicit", "usd_implied" -> scoreExplicit(salaryMinUsd, salaryMaxUsd, candidateMinSalary);
            case "unstated" -> new Result(50, "salary not stated");
            case "non_usd"  -> new Result(30, "non-USD currency");
            default         -> new Result(50, "unknown mode");
        };
    }

    private Result scoreExplicit(Integer jobMin, Integer jobMax, int target) {
        // Use the midpoint if both bounds available, otherwise the min
        int effectiveMin = jobMin != null ? jobMin : 0;
        int effectiveMid = (jobMin != null && jobMax != null)
                ? (jobMin + jobMax) / 2
                : effectiveMin;

        if (effectiveMid >= target) {
            // Comfortably meets or exceeds target
            int bonus = Math.min(10, (int) ((effectiveMid - target) / (double) target * 20));
            return new Result(Math.min(100, 90 + bonus),
                    "$" + fmt(effectiveMid) + " mid vs target $" + fmt(target));
        }

        if (effectiveMin >= target * 0.9) {
            // Within 10% of target — acceptable
            return new Result(70, "$" + fmt(effectiveMin) + " min vs target $" + fmt(target));
        }

        if (effectiveMin >= target * 0.75) {
            // 10-25% below — borderline
            return new Result(45, "below target by " + pct(effectiveMin, target) + "%");
        }

        // More than 25% below — hard miss
        return new Result(15, "well below target by " + pct(effectiveMin, target) + "%");
    }

    private String fmt(int v) {
        return v >= 1000 ? (v / 1000) + "k" : String.valueOf(v);
    }

    private int pct(int actual, int target) {
        return (int) Math.round((target - actual) / (double) target * 100);
    }
}
