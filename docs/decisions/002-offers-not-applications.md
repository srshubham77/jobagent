# ADR-002: Optimization target is offers received, not applications submitted

**Status:** Accepted
**Date:** 2026-04-26

## Context

The obvious framing for an "auto-apply" tool is volume — how many applications can it submit? That's easy to build, easy to demo, and easy to celebrate. But it's the wrong metric.

Cold applications convert at 2–5%. Referrals convert ~10x higher. A generic resume submitted at scale has roughly the same odds at every company; a tailored resume with a referral has dramatically better odds. A product that ships 200 generic applications per week at 1% reply rate produces 2 conversations. A product that ships 30 well-targeted applications per week at 15% reply rate produces 4.5 conversations — and the candidate spends less time, so the *rate* of meaningful interactions per hour is much higher.

The user goal is offers, not applications. These metrics are correlated but not identical, and they diverge at the tails.

## Decision

JobAgent's north star metric is **offers received per month.** The leading indicator is **Applied → Active conversion rate** (i.e., reply rate from recruiters or hiring managers). Every feature decision is evaluated against these.

Concrete consequences for product priority:

- **Per-application resume tailoring** is promoted to Phase 2 (was Phase 4 in the original plan). ATS keyword filtering is the dominant reason cold applications die; tailoring is the highest-leverage feature.
- **Referral path detection** is non-negotiable (Phase 3). Checking for warm intros before cold-applying is the single biggest conversion lever.
- **Fit scoring** is core, not optional. The Discovered tab is meaningless without a transparent score that filters volume noise.
- **Story bank** is a prerequisite for non-generic long-form answers. Without it, behavioral question responses converge on generic LLM output and don't improve over time.

Not all features survive this lens. **"Apply to as many jobs as possible per day"** is explicitly anti-goal. The product is not measured on application volume.

## Consequences

**Slower visible progress.** A volume-first product would have higher application counts to brag about. JobAgent will appear less productive on that axis.

**Higher per-application cost.** Tailored resumes and story-bank-based answers cost more LLM tokens than generic templates.

**Harder to evaluate.** Reply rates take weeks of real applications to measure; volume metrics are immediate. Need patience and a labeled holdout set for fit-score calibration.

**Better product.** This is the trade we're making knowingly.

## Open questions

- **At what volume does targeting stop helping?** If the user has saturated all relevant openings at all target companies, do we relax targeting and start applying more broadly? Probably not in v1, but worth revisiting.
- **How do we measure offer quality?** An offer at $200k with bad equity vs. one at $180k with good equity — the product currently treats both as "offer." Out of scope for v1; the user evaluates offers themselves.
