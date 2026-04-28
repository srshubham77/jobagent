# ADR-005: Five pipeline tabs, not eight

**Status:** Accepted
**Date:** 2026-04-26

## Context

The original PRD draft had eight pipeline tabs: Discovered, Drafted, Applied, Contacted, Interviewing, Rejected, Offer, Withdrawn. This mirrored the granularity of an ATS or CRM, where different states are visually separate.

Real funnel data tells a different story. Most applications die silently — Applied with no reply for 30 days. The ratio is roughly 100 applications → 5–15 replies → 2–5 interviews → 1 offer (in a good cycle). With eight tabs, six of them are nearly empty most of the time, and the user's eye is split across columns where most cards never move.

Faceting too aggressively hides the signal. If the user's main question is "what's pending?" the answer should be one column, not three.

## Decision

Five tabs:

| Tab | Definition |
|---|---|
| **Discovered** | Crawled, matches filter, not yet drafted |
| **Drafted** | Agent has generated a draft, awaiting review |
| **Applied** | Submitted successfully |
| **Active** | Any recruiter reply received — recruiter contact, screen scheduled, in interview process |
| **Closed** | Terminal state. Sub-tag: `rejected`, `offer`, `withdrawn`, `ghosted` (no reply after 30 days) |

The previous "Contacted" and "Interviewing" tabs collapse into Active. The previous "Rejected", "Offer", and "Withdrawn" tabs collapse into Closed with sub-tag pills. A "Referral requested" flag exists on items in Discovered/Drafted but is not its own tab — it's a property.

## Consequences

**Cleaner UI.** Five columns instead of eight. The user's eye lands on the right column without scanning past empty ones.

**Sub-tags preserve drill-down.** Closed sub-tags (offer / rejected / withdrawn / ghosted) keep the analytical detail without adding tab clutter. The Closed column has a sub-tab selector at the top to filter by sub-tag.

**Active is the "anything happening" column.** This is the one the user actually checks for action. Collapsing recruiter-contact and interview-scheduling into one column reflects how those states blur in real life — recruiters often jump straight from "got your application" to "let's chat tomorrow."

**Ghosting is now first-class.** Adding "ghosted" as a Closed sub-tag (auto-applied after 30 days of silence) acknowledges what actually happens to most applications. Without it, applications either stay in Applied forever or get manually closed, both of which are worse.

**Easier to maintain.** Fewer state machine transitions, fewer email classifier categories, fewer empty-state designs.
