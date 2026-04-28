# ADR-004: Three-tier submission model

**Status:** Accepted
**Date:** 2026-04-26

## Context

"Auto-apply" sounds like a single feature: the agent submits the application. In reality, submission has very different reliability profiles depending on the company's tooling.

Greenhouse, Lever, and Workable host most remote-tech ATS forms and have public APIs. A direct API submission is fast, predictable, and doesn't trigger anti-bot detection. Roughly 60% of remote tech jobs use one of these ATSes.

The other 40% are split between custom-hosted application portals (where Playwright is the only path), and companies that accept email applications. Playwright at scale from a single residential IP gets fingerprinted by Cloudflare, captcha gates, and ATS-specific bot detection. Greenhouse and Lever both have anti-bot systems even on their own forms — and submitting via an unaffiliated automated browser can get the user's account flagged.

Treating all submissions as one mechanism — "auto-submit" — is dishonest about reliability and risks user trust when Playwright fails silently or captcha-walls a submission.

## Decision

Three explicit tiers, surfaced in the UI before the user approves:

**Tier 1 — Direct ATS submit (reliable).** Greenhouse, Lever, Workable. The Apply service calls the ATS API directly. Submissions are fast (~3 seconds) and predictable. Confirmation is captured from the API response.

**Tier 2 — Automated browser (best-effort).** Playwright runs against the company's hosted application portal. Includes:
- Per-domain throttling (max N applications/day/domain)
- Human-like delays between actions (randomized, not constant)
- Session warmup (visit the careers page, browse, then apply)
- Optional residential proxy rotation (user-provided; not bundled)
- Automatic fallback to manual mode if Playwright detects a captcha or anti-bot challenge

**Tier 3 — Manual.** Mailto submissions and portals where automation isn't viable. The agent prepares the full payload (cover letter, answers, resume variant); the user clicks submit.

The tier is computed at draft time and shown in the Job detail screen. The user always knows which tier they're approving.

## Consequences

**Honest UX.** "This will submit via Greenhouse API in ~3 seconds" or "This will use an automated browser, may fall back to manual" is more trustworthy than a single ambiguous "Submit" button.

**Tier 1 covers the bulk reliably.** ~60% of submissions go through stable ATS APIs.

**Tier 2 builds in escape hatches.** When Playwright hits a wall, it doesn't silently fail or submit garbage — it falls back to manual.

**Residential proxy rotation is user-provided, not bundled.** Building in proxy rotation as a service introduces operational and legal complexity (do we own the proxies? how do we comply with the proxy provider's terms?). Better to let users plug in their own proxy if they want one.

**The kill switch halts all three tiers.** No tier bypasses the user's ability to stop automation immediately.
