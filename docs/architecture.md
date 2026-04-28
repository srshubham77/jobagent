# Architecture

Reference doc for JobAgent's system design. Companion to [architecture.svg](architecture.svg) (the visual diagram) and [PRD.md](PRD.md) (product spec). For decision rationale, see [decisions/](decisions/).

## Overview

JobAgent is a hybrid Java + Python microservices system. Services communicate via Kafka for async work and REST for sync calls. A Next.js frontend talks to an API gateway. Storage is Postgres (with pgvector for embeddings), Redis, and an S3-compatible object store.

The system is organized in five tiers:

1. **External sources** — job boards, Gmail, LinkedIn export, ATS APIs
2. **Ingestion** — crawlers and email tracker that turn raw external data into canonical events on Kafka
3. **Core services** — profile, matcher, network, apply, analytics; the business logic
4. **Storage** — Postgres, pgvector, Redis, object store
5. **UI** — API gateway and Next.js frontend

See [architecture.svg](architecture.svg) for the visual.

## Service breakdown

### Profile service (Java/Spring Boot)

Owns the candidate profile and story bank.

**Responsibilities:**
- Resume upload (PDF, DOCX) and parsing
- Structured profile CRUD
- Profile versioning — every application snapshots the profile version used
- Story bank: structured library of reusable behavioral narratives

**Parsing strategy:** local parser first (Apache Tika + custom extraction); fall back to a hosted service (Affinda or similar) on low-confidence extraction. Track confidence per field.

**Story bank:** each story is `{situation, action, result, metrics, themes, length_variants}`. Pre-populated from resume bullets, expanded through a guided onboarding interview. Used as source material whenever the Apply service generates a long-form behavioral answer.

**Endpoints (sketch):**
- `POST /profiles` — create from resume
- `GET /profiles/{id}` — read with version
- `PATCH /profiles/{id}` — edit, bumps version
- `POST /profiles/{id}/stories` — add story
- `GET /profiles/{id}/stories?theme=leadership` — query story bank

### Discovery service (Java/Spring Boot)

Pulls jobs from configured sources, normalizes them, and publishes canonical jobs.

**Responsibilities:**
- Per-source crawlers, each with its own scheduler and circuit breaker
- Salary normalization pipeline (regex + LLM extraction, USD classification)
- Deduplication across sources via fuzzy match on `(company, normalized_title, posted_date)`
- Publish canonical Job records to the `jobs.discovered` Kafka topic

**Sources (Phase 1):** RemoteOK (public API).
**Sources (Phase 2):** We Work Remotely, Wellfound, Hacker News "Who's Hiring."
**Sources (Phase 3, conditional):** LinkedIn — only via official Jobs API or partner feed. Direct scraping is excluded due to legal risk.

**Salary classification** is a first-class problem. Each job is labeled:
- `usd_explicit` — USD range stated
- `usd_implied` — non-USD currency but company pays remote-USD per public data
- `unstated` — no compensation info
- `non_usd` — explicitly paid in another currency

Only `usd_explicit` and `usd_implied` count toward the hard "USD-paying" filter. `unstated` is a soft inclusion the user can configure.

### Matcher service (Java/Spring Boot)

Scores jobs against the user's profile and surfaces matches.

**Inputs:**
- Skill overlap (profile skills ∩ JD required + nice-to-have skills, weighted)
- Seniority match (years of experience, scope keywords)
- Stack overlap (with primary/secondary weighting)
- Salary fit (job range vs. user's minimum)
- Domain match (e.g., fintech, e-commerce, infra)
- Recency of posting

**Computation:** hybrid approach — embedding similarity for free-text overlap (JD vs. profile summary + bullets, via pgvector), structured rules for hard fields (salary, seniority), LLM judgment as tie-breaker for top-N candidates.

**Output:** 0–100 fit score with a breakdown surfaced in the UI ("low because: stack overlap 30%, seniority match weak").

**Calibration:** user can mark jobs as "good match" / "bad match" → feeds back into weights.

### Network service (Java/Spring Boot, Phase 3)

Maps the user's LinkedIn network to jobs and surfaces referral paths.

**Responsibilities:**
- Ingest manual LinkedIn data export
- Build a connection graph
- For each high-fit job, identify 1st and 2nd degree connections at the company
- Generate copy-paste-ready referral request messages

**No LinkedIn scraping.** Manual export only. See [decisions/001-no-linkedin-scraping.md](decisions/001-no-linkedin-scraping.md).

### Apply service (Python/FastAPI)

Generates application drafts and orchestrates submission.

**Responsibilities:**
- Generate tailored resume variants per job (reorder bullets by JD relevance, swap in keywords that truthfully apply)
- Generate cover letters and Q&A drafts using profile + story bank
- Submission orchestration across three tiers
- Capture user edits as `(question, context, original_answer, edited_answer)` for the learning loop

**Three-tier submission model:**
1. **Tier 1 (reliable):** ATS APIs — Greenhouse, Lever, Workable. Direct API submit. ~60% of remote tech jobs.
2. **Tier 2 (best-effort):** Playwright headless browser for non-API sites. Per-domain throttling, human-like delays, captcha fallback to manual.
3. **Tier 3 (manual):** Mailto and manual portals. Agent prepares the payload; user submits.

The user always sees which tier a job falls into before approving.

**Why Python:** Playwright and the Anthropic SDK are first-class in Python. The other services are Java because that's the daily-driver stack, but the Apply service's two main dependencies (browser automation, LLM tooling) point clearly at Python. See [decisions/003-hybrid-stack.md](decisions/003-hybrid-stack.md).

### Tracker service (Java/Spring Boot, Phase 2)

Watches the user's email and updates application state.

**Responsibilities:**
- Gmail OAuth (read-only, scoped to messages received after first connection)
- LLM-based classifier per message: `ack` / `recruiter_contact` / `interview_scheduling` / `rejection` / `offer` / `irrelevant`
- Multi-signal application matching: sender domain → sender name → company mention → timestamp proximity
- Calendar invite parsing (`.ics` attachments + Gmail's structured event data)
- Pipeline state transitions, with a no-regression rule (state moves forward only without explicit user action)
- Ghosting timer: if no reply for 30 days, auto-promote to Closed/ghosted

**Privacy:** email content processed in-memory. Only metadata + classification result persisted. See [PRD.md §7](PRD.md).

### Analytics service (Java/Spring Boot, Phase 4)

Funnel rollups and conversion analytics.

**Responsibilities:**
- Append-only `FunnelEvent` log of state transitions
- Conversion rates per stage (Discovered → Drafted → Applied → Active → Offer)
- Breakdowns by source, role, resume variant, week, fit-score bucket
- Actionable callouts: "RemoteOK has a 0.5% reply rate — consider deprioritizing"

## Data flows

### Discovery flow

1. Per-source crawler in Discovery service runs on schedule
2. Raw `JobSource` records are written
3. Salary normalizer enriches each record (calls Apply service for LLM-based extraction, applies structured rules for canonical classification)
4. Deduper merges across sources → canonical `Job`
5. Job published to `jobs.discovered` Kafka topic
6. Matcher consumes, computes fit score, writes back to the Job record
7. High-scoring jobs surfaced in the UI's Discovered tab

### Apply flow

1. User opens a Discovered job in the UI
2. Apply service generates a draft:
   - Tailored resume variant (LLM call against profile + JD)
   - Cover letter (LLM call against profile + JD + story bank)
   - Q&A drafts (LLM calls per question, with story bank retrieval for behavioral questions)
3. Duplicate application guard runs against the Application table
4. UI shows a diff view; user approves with or without edits
5. Submission via Tier 1 (ATS API) → Tier 2 (Playwright) → Tier 3 (manual)
6. Submission log + screenshot persisted to object store
7. Application state → Applied; Kafka event on `applications.events`

### Tracking flow (Phase 2+)

1. Tracker service polls Gmail (or processes push notifications)
2. New messages classified by LLM
3. Multi-signal match against the Application table
4. State transition (Applied → Active, Active → Closed/sub-state)
5. Low-confidence matches go to a "Needs review" queue, never auto-moved
6. Pipeline event published; analytics consume

## Storage

### Postgres

Transactional store for all entities. Single instance for v1.

Key tables (full DDL TBD in Phase 1):
- `users`, `profiles`, `stories`
- `jobs`, `job_sources` (per-source raw record before canonicalization)
- `resume_variants`, `applications`, `answers`
- `email_events`, `connections`
- `funnel_events` (append-only)

### pgvector

Embeddings for fit scoring (JD vs. profile summary + bullets) and for the learning loop's answer retrieval. Same Postgres instance — pgvector extension.

### Redis

- Crawler dedup keys (`SET` with TTL per source)
- Per-domain rate limiting tokens for Tier 2 Playwright submissions
- Cache for LLM responses keyed by `(job_hash, profile_version)`

### Object store

S3-compatible (MinIO locally, real S3 in production):
- Original resume uploads
- Generated resume variants (per application)
- Submission confirmation screenshots
- Email attachments (parsed + discarded after classification)

## Inter-service communication

### Kafka topics

- `jobs.discovered` — canonical Job records published by Discovery
- `applications.events` — submission events, state transitions
- `email.events` — classified email events from Tracker

Each topic has explicit producers and consumers documented per service. Schema evolution via Avro or JSON Schema (TBD).

### Sync REST

Where Kafka isn't appropriate (UI requests, draft generation):
- API gateway → individual services
- Apply service → Profile service (story bank retrieval), Matcher (fit score lookup)

Internal REST traffic uses service-to-service auth (mTLS in production, shared secret in dev).

## Hard rules

These are non-negotiable and enforced in code, not just docs:

1. **Nothing auto-submits without human review in v1.** Every submission has an approval gate. The kill switch in the UI must halt automation in all services.
2. **No direct LinkedIn scraping.** [decisions/001](decisions/001-no-linkedin-scraping.md).
3. **No fabrication in resume tailoring.** Keywords are only swapped in if they truthfully apply, drawn from the user's profile.
4. **Email content is processed in-memory.** Only metadata + classification persisted.
5. **PII encrypted at rest.** Resume text, story bank entries, OAuth tokens, scraped recruiter contacts.

## Scale targets (v1)

Single user. ~500 jobs discovered/day. ~30–50 applications/week. Postgres + Redis + Kafka all single-instance. Kubernetes deployment is for operational consistency, not horizontal scale — most services run one replica in v1.

When the project moves beyond personal use, the bottlenecks are likely (in order): LLM costs, Playwright capacity, email classification accuracy at higher volume.
