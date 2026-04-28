# PRD: AI Job Application Agent

> **Status:** Draft v2.0
> **Author:** Shubham
> **Last updated:** April 26, 2026
> **Repo:** TBD

---

## 1. TL;DR

An AI-powered agent that builds a candidate profile from a resume/LinkedIn, discovers relevant remote jobs paying in USD across multiple sources, and applies on the user's behalf with human-in-the-loop review. Each application uses a JD-tailored resume variant, draws from a personal "story bank" for long-form answers, and surfaces referral paths before falling back to cold-apply. The system tracks every application through its full lifecycle using email crawling for state transitions, and learns from user edits to improve future drafts.

**Optimization target:** offers received, not applications submitted. See §3.

---

## 2. Problem Statement

Job hunting for remote, USD-paying roles is high-volume, low-signal work:

- Candidates spend hours filling near-identical forms across 50+ portals.
- Generic resumes get filtered out by ATS keyword matching before a human ever sees them.
- Cold applications convert at 2–5%; referrals convert ~10x higher, but candidates don't systematically check for warm intros before applying.
- Tracking application state across email, LinkedIn DMs, and ATS portals is manual and error-prone.
- Surfacing the right openings (remote, USD, role-fit, salary band) requires repeated filtering across fragmented sources.

There is no single tool that owns the full pipeline: **profile → discovery → fit scoring → tailoring → warm-intro check → application → tracking → learning**.

---

## 3. Goals & Non-Goals

### Primary Goal

**Maximize offers received per unit of candidate time** — not applications submitted. A product that ships 30 well-targeted applications/week at a 15% reply rate beats one that ships 200/week at 1%. Every feature decision is evaluated against this.

### Secondary Goals

1. Reduce per-application time from ~20 minutes to under 2 minutes of human review.
2. Centralize all remote, USD-paying openings matching the candidate profile in one dashboard with a transparent fit score.
3. Maintain a single source of truth for application state, automatically updated from email signals.
4. Improve answer quality over time by learning from human-reviewed corrections.

### Non-Goals (v1)

- Not a generic ATS or recruiter-facing product.
- Not handling INR-paying or India-only roles in v1 — explicit scope is remote + USD.
- Not auto-submitting without review in v1. Every application requires a one-click human approval.
- Not a multi-LLM-provider abstraction. Built for Claude; swap later if needed.

---

## 4. Target User

- **Primary:** Mid-to-senior software engineers (3–8 YOE) actively searching for remote roles paying in USD.
- **Persona traits:** Comfortable with technical setup, values automation, wants control over what gets submitted, currently juggling 30–100 applications per cycle.

---

## 5. User Stories

1. As a candidate, I want to upload my resume once and have the system extract a structured profile, so I don't repeat data entry.
2. As a candidate, I want the system to suggest target roles based on my profile, but let me override or add roles manually.
3. As a candidate, I want a single feed of remote, USD-paying jobs filtered to my profile, with a transparent fit score I can calibrate.
4. As a candidate, I want a JD-tailored resume variant generated for each application I approve.
5. As a candidate, I want the system to flag jobs where I have a 1st/2nd degree connection, so I can pursue a referral before cold-applying.
6. As a candidate, I want the agent to draft application answers — including long-form behavioral questions — using my real stories, show me a diff/preview, and submit on approval.
7. As a candidate, I want my applied jobs to automatically move through pipeline states based on email replies, without forwarding anything.
8. As a candidate, I want the agent to remember corrections I make, so it doesn't repeat the same mistakes.
9. As a candidate, I want a kill switch that halts all automation immediately if something looks wrong.
10. As a candidate, I want a funnel view that shows which sources, roles, and resume variants actually convert.

---

## 6. Functional Requirements

### 6.1 Profile Builder

- Resume upload (PDF, DOCX) → parse into structured fields: contact, summary, experience, education, skills, projects, certifications.
- Parsing strategy: try local parser first; fall back to a hosted service (Affinda or similar) on low-confidence extraction. Track parse confidence per field.
- Optional LinkedIn import (manual export or OAuth where available) to enrich/cross-validate.
- If no resume: guided form-based intake.
- Generated profile is editable. User can edit any field before locking it.
- **Profile versioning:** each application snapshots the profile version used. When the user updates their profile, in-flight drafts get a "regenerate with new profile?" prompt; submitted applications retain their original snapshot.

### 6.2 Story Bank

- Separate from the resume — a structured library of the candidate's reusable narratives, each tagged with themes (leadership, conflict, technical depth, ambiguity, scale, failure, etc.) and linked to specific projects/roles.
- Each story has: situation, action, result, metrics, themes, length variants (50/150/300 words).
- Pre-populated by the agent from resume bullets, then expanded through a guided interview at onboarding ("Tell me about the Oracle-to-Mongo migration — what went wrong?").
- Used as the source material for any long-form behavioral or open-ended application question. Without this, generated long-form answers are generic.

### 6.3 Role Targeting

- System suggests target roles based on profile (e.g., "Senior Backend Engineer," "Staff Backend Engineer," "Platform Engineer").
- User can add/remove target roles manually.
- User sets filters: minimum salary (USD), location/remote policy, seniority, company size, tech stack must-haves and nice-to-haves.

### 6.4 Job Discovery

- **Sources (v1):** RemoteOK (public API), We Work Remotely, Wellfound, Hacker News "Who's Hiring."
- **Sources (v2):** Job24x, YC jobs board, company careers pages via watchlist.
- **Sources (v3, conditional):** LinkedIn — only via official Jobs API or partner feed. Direct scraping is excluded due to legal risk; treated as out-of-scope unless an official path is available.
- Each source runs as an independent crawler/connector with its own scheduler and circuit breaker.
- Hard filter: remote-eligible AND pays in USD. See §6.5 for salary handling.
- Deduplication across sources via (company + normalized title + posted_date) fuzzy match.

### 6.5 Salary Normalization Pipeline

Salary parsing is a first-class problem, not a one-line heuristic.

- **Extract:** regex + LLM extraction of compensation strings from JD body, structured fields, and source metadata.
- **Normalize:** convert all detected ranges to USD-equivalent annual base. Handle "$120-180k DOE," "€90k+," "competitive," "based on location," "$60/hr contract," etc.
- **Classify each job into one of:**
  - `usd_explicit` — USD range stated.
  - `usd_implied` — non-USD currency but company pays remote-USD per public data.
  - `unstated` — no compensation info.
  - `non_usd` — explicitly paid in another currency with no USD path.
- **User-configurable behavior** for `unstated` jobs: include / exclude / surface separately. Default: include but flag.
- Only `usd_explicit` and `usd_implied` count toward the hard filter; `unstated` is a soft inclusion.

### 6.6 Fit Scoring

The core ranking signal. Without this, the Discovered feed is noise.

- **Inputs:**
  - Skill overlap (profile skills ∩ JD required + nice-to-have skills, weighted).
  - Seniority match (years of experience, scope keywords like "lead," "staff," "principal").
  - Stack overlap (Java, Spring, Kafka, etc. — with primary/secondary weighting).
  - Salary fit (job range vs. user's minimum).
  - Domain match (e.g., fintech, e-commerce, infra) against profile.
  - Recency of posting.
- **Computation:** hybrid — embedding similarity for free-text overlap (JD vs. profile summary + bullets), structured rules for hard fields (salary, seniority), LLM judgment as a tie-breaker for top-N.
- **Output:** 0–100 score with a breakdown the user can see ("low because: stack overlap 30%, seniority match weak").
- **Calibration:** user can mark jobs as "good match" / "bad match" → feeds back into weights.

### 6.7 Referral & Warm-Intro Path

Referrals convert ~10x cold applications. Checking for them is non-negotiable.

- For each high-fit job, check the user's LinkedIn network (via export or OAuth) for 1st and 2nd degree connections at the company.
- Surface in the job detail view: "You have 3 connections at Stripe — Alice (1st, Senior PM), Bob (2nd, via Charlie)."
- Provide a draft message the user can send to request a referral, with one-click copy. Never send on the user's behalf without explicit action.
- Job state machine accommodates a "Referral requested" intermediate state before "Applied."

### 6.8 Per-Application Resume Tailoring

- For each approved application, the agent generates a JD-tailored resume variant:
  - Reorders experience bullets by JD relevance.
  - Swaps in JD keywords where they truthfully apply (no fabrication — pulled from the profile only).
  - Adjusts the summary line to mirror the JD's framing.
- Diff view shows the user what changed vs. the base resume.
- All variants are stored and linked to the application for later analytics ("which variant style converts best?").
- This was Phase 4 in v1 of the PRD; promoted to Phase 2 because ATS keyword filtering is the dominant reason cold applications die.

### 6.9 Apply Flow (Human-in-the-Loop)

- For each shortlisted job, agent generates a draft application:
  - JD-tailored resume variant (§6.8).
  - Tailored cover letter / short pitch.
  - Pre-filled answers to common screening questions, drawing from profile + story bank (§6.2).
- **Duplicate application guard:** before generating a draft, check if an application to (company, normalized_title) already exists in any non-Closed state. If yes, surface and require explicit override.
- Diff view: agent-generated vs. profile defaults vs. previous answers to similar questions.
- One-click "Approve & Submit" → automation submits via the job's apply URL.
- "Approve with edits" → user edits answers; agent stores the diff as a learning signal (§6.10).
- **Submission methods (in priority order):**
  1. Direct API integration where ATS supports it (Greenhouse, Lever, Workable have public APIs). This is the reliable path; ~60% of remote tech jobs use these ATSes.
  2. Headless browser automation (Playwright) for sites without APIs. **Best-effort only** — see §6.11 for failure handling.
  3. Mailto-based submissions where company accepts email applications.
- Every submission logs: timestamp, payload, screenshot of confirmation, response status, ATS used.

### 6.10 Learning Loop

- Every user edit on a draft is captured as `(question, context, original_answer, edited_answer)`.
- Edits stored in pgvector and retrieved on similar future questions — when a similar question appears, the agent surfaces the user's preferred phrasing as the starting draft.
- User can also explicitly "Save as preferred answer" for any field.
- Surface a "your phrasing is being used" indicator on drafts so the user trusts the loop is working.

### 6.11 Auto-Submit Reliability

Auto-submitting via headless browser at scale from one IP gets fingerprinted fast. The PRD treats this realistically:

- **Tier 1 (reliable):** ATS APIs (Greenhouse, Lever, Workable). Full auto-submit supported.
- **Tier 2 (best-effort):** Playwright on non-API sites. Requires:
  - Per-domain throttling (max N applications/day/domain).
  - Human-like delays between actions (randomized, not constant).
  - Session warmup (visit the careers page, browse, then apply).
  - Optional residential proxy rotation (user-provided; not a built-in service).
  - Automatic fallback to "manual submit" if Playwright detects a captcha or anti-bot challenge.
- **Tier 3 (manual):** Mailto + manual portals. The agent prepares the payload; the user submits.
- The user always sees which tier a job falls into before approving.

### 6.12 Application Tracking & Pipeline

Reduced from 8 tabs to 5 — most applications die silently and over-faceting the UI hides the signal.

| Tab | Definition | How items move in |
|---|---|---|
| **Discovered** | Crawled, matches filter, not yet drafted | Crawler output |
| **Drafted** | Agent has generated a draft, awaiting review | After agent runs on a Discovered item |
| **Applied** | Submitted successfully | After Approve & Submit |
| **Active** | Any recruiter reply received — recruiter contact, screen scheduled, in interview process | Email crawler detects relevant reply |
| **Closed** | Terminal state. Sub-tag: `rejected`, `offer`, `withdrawn`, `ghosted` (no reply after 30 days) | Email classifier or manual action |

A `Referral requested` flag exists on items in Discovered/Drafted (§6.7) but is not its own tab — it's a property of the item.

### 6.13 Email Crawler

- OAuth into Gmail (and optionally other providers).
- Read-only scope, scoped to messages received after first connection.
- LLM-based classifier categorizes each new message: `ack`, `recruiter_contact`, `interview_scheduling`, `rejection`, `offer`, `irrelevant`.
- **Matching strategy:** sender domain → sender name (recruiters often write from personal Gmail) → mention of company name in body → application timestamp proximity. Multi-signal match with a confidence score.
- **Calendar invites:** parse `.ics` attachments and Gmail's structured event data; promote to Active state on interview scheduling even without a text email.
- **Thread continuity:** if user replies and the thread stays open, state holds. If the thread goes silent for 30 days, auto-promote to Closed/ghosted.
- **Confidence threshold:** low-confidence matches go to a "Needs review" queue, never auto-moved. Recruiter replying from personal Gmail with no domain match → review queue.
- **State regression rule:** state can move forward (Applied → Active → Closed) but not backward without explicit user action.

### 6.14 Recruiter Contact Enrichment

- For each job, attempt to extract hiring manager / recruiter contact from:
  - JD itself (often listed at the bottom).
  - LinkedIn page of the job posting (poster's profile).
  - Company "Team" or "About" pages for the relevant function head.
- Display in the job detail view; never auto-message without explicit user action.
- Cross-reference with the network check in §6.7.

### 6.15 Analytics & Funnel View

The user needs to see if the product is actually working.

- **Funnel:** Discovered → Drafted → Applied → Active → Offer, with conversion rate at each stage.
- **Breakdowns:** by source, by role, by resume variant, by week, by fit-score bucket.
- **Time-based:** week-over-week trend on reply rate.
- **Actionable surface:** "RemoteOK has a 0.5% reply rate over the last 30 days — consider deprioritizing." "Resume variant A converts at 2x variant B for backend roles."
- This is also the differentiator vs. existing tools like Huntr.

### 6.16 Kill Switch

- Global one-click "halt all automation."
- Stops: crawlers, draft generation, auto-submit, email classifier writes.
- Surfaces in the top nav at all times; not buried in settings.
- Required for any system that acts on the user's behalf.

---

## 7. Non-Functional Requirements

- **Privacy:** Resume, email content, and credentials are sensitive. All PII encrypted at rest. Email content processed in-memory where possible; only metadata + classification result persisted.
- **Auth:** OAuth for LinkedIn, Gmail. Job portal credentials stored encrypted (per-user key) — only used for autofill, never shared.
- **Reliability:** Crawlers must handle rate limits and IP blocks gracefully. Per-source circuit breakers.
- **Cost:** LLM calls are the dominant cost. Cache aggressively per (job_hash, profile_version). Track per-user monthly LLM spend; surface to the user.
- **Compliance:** Respect robots.txt and ToS for each source. LinkedIn scraping is excluded from v1 sources.
- **Scale (v1 target):** Single user, ~500 jobs discovered/day, ~30–50 applications/week.

---

## 8. System Architecture (high-level)

Seven logical services. Maps cleanly to a Spring Boot + Kafka layout, though stack choice is in §15.

- **Profile Service** — resume parsing, profile CRUD, versioning, story bank.
- **Discovery Service** — per-source crawlers publishing to a `jobs.discovered` topic; deduper consumes and writes canonical jobs; salary normalizer enriches.
- **Matcher Service** — fit scoring against profile + filters; promotes matches.
- **Network Service** — LinkedIn connection lookup, referral path detection.
- **Apply Service** — draft generation (LLM), resume tailoring, submission orchestrator (Playwright workers + ATS API clients), per-domain throttling.
- **Tracker Service** — email ingestion, classification, state transitions, ghosting timer.
- **Analytics Service** — funnel rollups, conversion stats, per-variant tracking.
- **API Gateway + UI** — Next.js frontend, REST/GraphQL backend.

Storage: Postgres for transactional data, object storage for resumes/screenshots/resume variants, Redis for crawler dedup + per-domain rate limiting, pgvector for the learning loop and fit scoring embeddings.

---

## 9. Data Model (key entities)

- `User` — auth, settings, OAuth tokens.
- `Profile` — versioned, FK to User.
- `Story` — story bank entry, FK to Profile, themes[], length variants.
- `Job` — canonical job record with source list, dedup hash, salary classification, fit score.
- `JobSource` — per-source raw record before canonicalization.
- `ResumeVariant` — generated per application, FK to Profile version + Job.
- `Application` — FK to User, Job, Profile version, ResumeVariant. State, sub-state, submission log, tier used.
- `Answer` — question, generated_answer, final_answer, application_id. Powers the learning loop.
- `EmailEvent` — raw classification result, application_id (nullable), confidence.
- `Connection` — LinkedIn connection node for the network/referral feature.
- `FunnelEvent` — append-only log of state transitions for analytics.

---

## 10. UI Surface (v1)

- **Onboarding:** resume upload → parse preview → edit → story bank guided interview → confirm.
- **Dashboard:** counts per tab, today's discoveries, pending drafts, funnel snapshot, kill switch in top nav.
- **Jobs feed:** filterable list with fit score breakdown, salary classification, source, referral indicator.
- **Job detail:** JD, recruiter contact, network connections, draft preview with diff, submission tier, submit button.
- **Pipeline view:** kanban-style across the 5 tabs from §6.12.
- **Analytics view:** funnel, breakdowns, trends (§6.15).
- **Settings:** profile, story bank editor, target roles, filters, connected accounts, LLM cost dashboard.

---

## 11. Phased Rollout

3–4 month build at evening pace. Phases re-sequenced to put the highest-leverage features earlier.

### Phase 1 — MVP (target: 4 weeks)

- Profile builder from resume upload + story bank guided interview.
- One discovery source (RemoteOK).
- Salary normalization pipeline (§6.5).
- Fit scoring v1 (§6.6).
- Manual apply: agent drafts with story bank, user copies, submits manually.
- Three states: Discovered, Drafted, Applied (manual move).

**Success criteria:** drafted applications for 20 real jobs end-to-end without breaking; fit scores feel right after calibration.

### Phase 2 — Tailoring + Auto-Apply + Tracking (target: 5 weeks)

- **Per-application resume tailoring (§6.8) — promoted from v1's Phase 4.**
- Add We Work Remotely, Wellfound, Hacker News "Who's Hiring."
- Tier 1 auto-submit via ATS APIs (Greenhouse, Lever).
- Email crawler with Gmail OAuth → Active and Closed states.
- Duplicate application guard.
- Kill switch.

### Phase 3 — Network + Learning (target: 4 weeks)

- LinkedIn network import (manual export, not scraping).
- Referral path detection (§6.7).
- Learning loop with answer retrieval (§6.10).
- Recruiter contact enrichment.
- Tier 2 Playwright auto-submit with throttling and fallback.

### Phase 4 — Analytics + Polish

- Funnel view (§6.15).
- Multi-resume variant analytics.
- Pipeline kanban view.
- Notifications.

---

## 12. Risks & Open Questions

- **LinkedIn scraping risk:** excluded from v1 sources. Network feature uses manual export, not scraping. Revisit only if an official partner path opens up.
- **Email classification accuracy:** false positives on Closed/offer or Closed/rejected damage trust. Confidence threshold + review queue + no-state-regression rule mitigate, but accuracy needs to be measured continuously. Target: > 95% on a labeled holdout set before auto-moving.
- **Auto-submit failure modes:** a misconfigured Playwright script could submit garbage. Hard requirement: human approval gate, dry-run, kill switch, per-domain throttle.
- **Cost ceiling:** at ~50 applications/week with multiple LLM calls each plus tailored resume generation, monthly LLM spend could hit $50–120. Track per-user cost from day one and surface in UI.
- **Resume parsing accuracy:** PDF parsing is brittle. Local parser first, hosted fallback (Affinda) on low confidence.
- **Story bank cold start:** the guided interview needs to feel useful, not tedious. Risk of users skipping it and ending up with generic long-form answers anyway. Mitigation: make it skippable but show a "long-form answer quality: low" warning until populated.
- **Fit score calibration:** the score is meaningless until calibrated. First-week UX has to bias the user toward labeling matches as good/bad.

---

## 13. Success Metrics

Aligned with the primary goal in §3 — offers, not application volume.

- **North star:** offers received per month.
- **Leading indicator:** Applied → Active conversion rate (i.e. reply rate). Target: > 10% by Phase 3, vs. industry baseline of 2–5% for cold applications.
- **Time-to-apply:** median seconds from "open draft" to "submitted." Target: < 90s by Phase 2.
- **State accuracy:** % of applications in correct tab when audited. Target: > 95%.
- **Learning lift:** % reduction in user edits per draft over time.
- **Referral capture rate:** % of high-fit jobs at companies with 1st/2nd degree connections where the user pursued a referral path.
- **Coverage:** % of remote-USD jobs in target roles surfaced vs. a manual baseline check.

---

## 14. Out of Scope (explicit)

- Mobile app.
- Cover letter as standalone product.
- Multi-user / team / agency mode.
- Salary negotiation assistance.
- Mock interview prep.
- Anything that auto-submits without review.
- Direct LinkedIn scraping.
- Multi-LLM-provider abstraction.

---

## 15. Tech Stack (proposed)

Picked to lean on stack already operated daily, with additions for the AI/automation layer.

- **Backend:** Java 21 + Spring Boot 3 (microservices) for Profile, Discovery, Matcher, Tracker, Analytics. Python + FastAPI for the Apply Service (LLM tooling and Playwright are friendlier in Python). Communicate via Kafka.
- **Async:** Kafka for inter-service events.
- **Storage:** Postgres + pgvector, Redis, S3-compatible object store.
- **Automation:** Playwright (Python) for Tier 2 submission.
- **LLM:** Anthropic Claude API for drafting, classification, and tailoring. No provider abstraction in v1.
- **Frontend:** Next.js + Tailwind + shadcn/ui.
- **Infra:** Docker Compose for local, Kubernetes for hosted, GitHub Actions for CI.
- **Auth:** OAuth 2.0 (Google, LinkedIn export), JWT for app sessions.
