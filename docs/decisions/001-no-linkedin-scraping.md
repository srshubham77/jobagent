# ADR-001: Exclude direct LinkedIn scraping from v1

**Status:** Accepted
**Date:** 2026-04-26

## Context

LinkedIn is the largest source of remote tech jobs and the natural place to look for warm-intro paths via the user's network. Scraping LinkedIn at scale would maximize discovery coverage and unlock the referral feature. But LinkedIn's Terms of Service prohibit automated access to the platform, and the legal landscape around it is hostile.

The relevant precedent is **hiQ Labs v. LinkedIn**, which went through multiple rounds in US courts. While the early rulings favored hiQ on Computer Fraud and Abuse Act grounds, the case was ultimately resolved with a permanent injunction against hiQ in 2022. The takeaway: scraping LinkedIn is legally fraught even when the data is public, and LinkedIn actively pursues legal action against scrapers.

For a portfolio project on a public GitHub repo with my real name on it, the legal exposure is unacceptable. For a hosted product, it would be company-ending.

## Decision

JobAgent does not scrape LinkedIn directly in v1.

- Job discovery uses RemoteOK, We Work Remotely, Wellfound, and Hacker News "Who's Hiring" — all of which permit programmatic access or have public APIs.
- The network/referral feature uses **manual LinkedIn data export** (the user downloads their connections data from LinkedIn settings and uploads the file).
- LinkedIn-as-a-source is reconsidered only if an official Jobs API or partner feed becomes available.

## Consequences

**Lower coverage in early phases.** Many remote tech jobs are listed on LinkedIn that won't appear in our discovery feed. Mitigated by the four other sources covering substantial overlap.

**No legal exposure.** The repo can be public, the project can be discussed openly, and there's no risk of takedown.

**Network feature still works.** Manual export gives us the connection graph without scraping.

**Easy to revisit.** If LinkedIn launches an official Jobs API or a partner feed for tools like this, we can add it as a source without restructuring anything.
