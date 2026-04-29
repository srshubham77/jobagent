package com.jobagent.discovery.salary;

public record SalaryResult(
        String mode,        // usd_explicit | usd_implied | unstated | non_usd
        Integer minUsd,
        Integer maxUsd,
        String raw          // original string that was parsed
) {
    public static SalaryResult unstated() {
        return new SalaryResult("unstated", null, null, null);
    }

    public static SalaryResult nonUsd(String raw) {
        return new SalaryResult("non_usd", null, null, raw);
    }

    public static SalaryResult explicit(int min, Integer max, String raw) {
        return new SalaryResult("usd_explicit", min, max, raw);
    }

    public static SalaryResult implied(Integer min, Integer max, String raw) {
        return new SalaryResult("usd_implied", min, max, raw);
    }
}
