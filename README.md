<div align="center">

# JobAgent

**An AI agent that finds remote, USD-paying engineering jobs and applies on your behalf.**

[![Status](https://img.shields.io/badge/status-Phase%201%20complete-brightgreen)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Stack](https://img.shields.io/badge/stack-Java%20%7C%20Python%20%7C%20Next.js-informational)]()

[Documentation](#documentation) · [Quick start](#quick-start) · [Architecture](#architecture) · [Roadmap](#roadmap)

</div>

---

## What this is

Job hunting for remote, USD-paying roles is high-volume, low-signal work. Candidates fill near-identical forms across 50+ portals, generic resumes get filtered by ATS keyword matching before a human sees them, and tracking application state across email, LinkedIn DMs, and ATS portals is manual and error-prone.

JobAgent is a single tool that owns the full pipeline: **profile → discovery → fit scoring → tailoring → warm-intro check → application → tracking → learning.**

The agent builds a candidate profile from a resume and LinkedIn export, discovers remote USD-paying jobs across multiple sources, generates a JD-tailored resume and answers for each application using a personal "story bank," surfaces referral paths before falling back to cold-apply, and tracks every application through its full lifecycle using email crawling for state transitions. It learns from your edits to improve future drafts.

**Optimization target:** offers received per unit of candidate time — not applications submitted. A product that ships 30 well-targeted applications per week at a 15% reply rate beats one that ships 200 per week at 1%.

## Screenshots

> Screenshots from the live UI. Designs created with [Claude Design](https://claude.ai/design).

<table>
  <tr>
    <td><img src="docs/screenshots/dashboard.png" alt="Dashboard" /></td>
    <td><img src="docs/screenshots/jobs-feed.png" alt="Jobs feed" /></td>
  </tr>
  <tr>
    <td align="center"><sub><b>Dashboard</b><br/>Pipeline counts, today's high-fit discoveries, pending reviews, funnel snapshot</sub></td>
    <td align="center"><sub><b>Jobs feed</b><br/>Filterable list with fit score, salary classification, tier badge, pipeline state</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/job-detail.png" alt="Job detail — draft preview" /></td>
    <td><img src="docs/screenshots/pipeline.png" alt="Pipeline kanban" /></td>
  </tr>
  <tr>
    <td align="center"><sub><b>Job detail — draft preview</b><br/>Tailored resume diff and Q&A drawn from the story bank, ready to approve</sub></td>
    <td align="center"><sub><b>Pipeline kanban</b><br/>5-column board (Discovered → Drafted → Applied → Active → Closed) with sub-tags</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/analytics.png" alt="Analytics" /></td>
    <td><img src="docs/screenshots/settings.png" alt="Settings" /></td>
  </tr>
  <tr>
    <td align="center"><sub><b>Analytics</b><br/>Conversion funnel, reply rate by source and resume variant, actionable callouts</sub></td>
    <td align="center"><sub><b>Settings</b><br/>Agent rules, automation toggles, kill switch, connected accounts</sub></td>
  </tr>
</table>

## Why this is interesting

A few things make this more than a thin wrapper around an LLM.

**Offers, not applications.** Every feature is evaluated against reply rate and offers received, not application volume. Resume tailoring, fit scoring, and the referral path check exist because cold-apply at scale is a losing strategy.

**Story bank for long-form answers.** Generic LLM-generated answers to "Tell me about a time you led a difficult migration" are easy to spot. JobAgent maintains a structured library of the candidate's real narratives — situation, action, result, metrics, themes — and draws from it when a similar question appears. Each generated answer is attributed back to its source story.

**Salary normalization as a first-class problem.** "USD-paying" is the core hard filter, but real JDs say "competitive," "$120-180k DOE," "€90k+," "based on location." A dedicated pipeline classifies each job into `usd_explicit` / `usd_implied` / `unstated` / `non_usd` so the filter is honest about uncertainty rather than dropping half the feed.

**Three-tier submission model.** Auto-submitting via headless browser at scale gets fingerprinted by Greenhouse and Lever fast. The agent uses ATS APIs where reliable (Tier 1, ~60% of remote tech jobs), best-effort Playwright with throttling and captcha fallback for the rest (Tier 2), and a manual prepare-and-submit path when neither works (Tier 3). The user always sees which tier a job falls into before approving.

**Learning loop with attribution.** Every user edit is captured as `(question, context, original_answer, edited_answer)` and stored as embeddings. When a similar question appears later, the user's preferred phrasing is the starting draft — and the UI surfaces a "your phrasing is being used" indicator so the loop is visible.

**Email crawling for state transitions.** OAuth into Gmail, classify each new message (`ack` / `recruiter_contact` / `interview_scheduling` / `rejection` / `offer` / `irrelevant`), match to an Application via multi-signal scoring (sender domain → sender name → company mention → timestamp proximity), and update pipeline state without the user forwarding anything. Calendar invites are parsed as a special case.

**Human-in-the-loop, always.** Nothing auto-submits without review in v1. A global kill switch in the top nav halts all automation — the toggle writes directly to the database so it takes effect on the next submit, with no service restart required.

## Architecture

JobAgent is a hybrid Java + Python microservices system with a Next.js frontend.

![Architecture diagram](docs/architecture.svg)

**Seven logical services:**

| Service | Runtime | Responsibility |
|---|---|---|
| **Profile** | Java / Spring Boot | Resume parsing (Tika + Claude), profile versioning, story bank CRUD |
| **Discovery** | Java / Spring Boot | RemoteOK, We Work Remotely, HN Who's Hiring crawlers; salary normalizer; circuit breaker |
| **Matcher** | Java / Spring Boot | 4-dimension fit scoring: skill overlap, seniority, salary fit, recency |
| **Apply** | Python / FastAPI | Cover letter + Q&A draft generation, resume tailoring, Playwright Tier 2 submission |
| **Network** | Java / Spring Boot | LinkedIn connection lookup, referral path detection (Phase 3) |
| **Tracker** | Java / Spring Boot | Gmail OAuth ingestion, email classification, state transitions (Phase 2) |
| **Analytics** | Java / Spring Boot | Funnel rollups, per-variant reply rates (Phase 4) |

**Storage:** Postgres + pgvector (transactional + embeddings), Redis (crawler dedup, rate limiting), S3-compatible object store (resumes, screenshots).

**The Apply service is in Python** because Playwright and the Anthropic SDK are first-class there. Everything else is Java.

For full architecture detail, data model, and service responsibilities, see [docs/architecture.md](docs/architecture.md).

## Quick start

### Prerequisites

- Docker and Docker Compose (all services containerized)
- An Anthropic API key

### One-command setup

```bash
git clone https://github.com/srshubham77/jobagent.git
cd jobagent

# Copy and fill in your API key
cp .env.example .env
# edit .env — set ANTHROPIC_API_KEY at minimum

# Start everything: Postgres + all services + frontend
docker compose up -d

# Tail logs
docker compose logs -f
```

The app is at **http://localhost:3000**. Flyway migrations run automatically on startup.

### Bootstrap a user (Phase 1 — no auth yet)

```bash
# Create the dev user (or get its ID if already exists)
curl -s -X POST http://localhost:8081/users/bootstrap \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}' | jq .

# Upload a resume
curl -s -X POST http://localhost:8081/profiles/upload \
  -H "X-User-Id: <userId-from-above>" \
  -F "file=@/path/to/resume.pdf" | jq .
```

Then open the UI, go to **Settings → Automation**, and turn on the agent. The discovery crawlers run on their configured schedule (every 6 hours for RemoteOK and WWR, once daily for HN).

### Manual trigger

```bash
# Trigger a crawl run immediately
curl -X POST http://localhost:8082/crawl
```

### Development (without Docker)

```bash
# Infrastructure only (Postgres + Redis)
docker compose up -d postgres redis

# Profile service
cd services/profile
./gradlew bootRun

# Discovery service
cd services/discovery
./gradlew bootRun

# Matcher service
cd services/matcher
./gradlew bootRun

# Apply service
cd services/apply
uv sync && uv run uvicorn apply.main:app --reload --port 8084

# Frontend
cd web
npm install && npm run dev
```

### Configuration

All configuration lives in `.env`. See `.env.example` for the full list.

**Required for Phase 1:**

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Draft generation, salary normalization |
| `DATABASE_URL` | Postgres connection string |
| `DATABASE_USER` / `DATABASE_PASSWORD` | DB credentials |

**Optional — later phases:**

| Variable | Purpose |
|---|---|
| `GMAIL_OAUTH_CLIENT_ID/SECRET` | Tracker service (Phase 2) |
| `GREENHOUSE_API_KEY`, `LEVER_API_KEY` | Tier 1 auto-submit (Phase 2) |

## Documentation

- [docs/PRD.md](docs/PRD.md) — full product requirements, optimization target, scope, risks
- [docs/architecture.md](docs/architecture.md) — service breakdown, data model, key flows
- [docs/architecture.svg](docs/architecture.svg) — architecture diagram
- [docs/design-briefs.md](docs/design-briefs.md) — Claude Design briefs and design system tokens
- [docs/decisions/](docs/decisions/) — ADRs for significant decisions

## Roadmap

### ✅ Phase 1 — MVP (complete)

- Profile service: resume upload and parsing (Apache Tika + Claude), structured profile CRUD, version history, story bank with STAR format and themes
- Discovery service: RemoteOK, We Work Remotely (RSS), and HN "Who's Hiring" (Algolia API) crawlers; per-source circuit breaker
- Salary normalization pipeline: regex classification (`usd_explicit` / `usd_implied` / `unstated` / `non_usd`), Claude Haiku fallback for ambiguous cases
- Matcher service: 4-dimension fit scoring (skill overlap 35%, seniority 25%, salary fit 25%, recency 15%); score stored with full breakdown
- Apply service: cover letter + Q&A generation using story bank, resume tailoring (keywords only, no fabrication), Tier 1 (Greenhouse/Lever API), Tier 2 (Playwright), Tier 3 (manual)
- Kill switch: `agent_enabled` toggle persisted in DB, checked on every submit call, wired to Settings UI
- Frontend: Next.js 14 dashboard with kill switch connected to real API
- Infrastructure: multi-stage Docker builds for all services, full Docker Compose stack

**Success criteria:** drafted applications for 20 real jobs end-to-end without breaking; fit scores feel right after calibration.

### Phase 2 — Tracking + Tier 1 auto-submit

- Email crawler with Gmail OAuth → `Active` and `Closed` state transitions
- Tier 1 auto-submit via Greenhouse and Lever ATS APIs
- Duplicate application guard
- Application approval queue with one-click approve/reject

### Phase 3 — Network + learning

- LinkedIn manual export ingestion
- Referral path detection and surfacing
- Learning loop: embed user edits, retrieve at draft time (pgvector)
- Recruiter contact enrichment

### Phase 4 — Analytics + polish

- Funnel view with breakdowns by source and resume variant
- Notifications: new high-fit discoveries, recruiter replies
- Pipeline kanban in sync with live application state

## Project structure

```
jobagent/
├── docs/                       # PRD, architecture, ADRs, design briefs
│   ├── PRD.md
│   ├── architecture.md
│   ├── architecture.svg
│   ├── design-briefs.md
│   └── decisions/              # ADRs
├── services/
│   ├── profile/                # Java/Spring Boot — profile + story bank
│   ├── discovery/              # Java/Spring Boot — crawlers + salary normalizer
│   ├── matcher/                # Java/Spring Boot — fit scoring
│   ├── network/                # Java/Spring Boot — LinkedIn + referrals
│   ├── tracker/                # Java/Spring Boot — email ingestion (Phase 2)
│   ├── analytics/              # Java/Spring Boot — funnel rollups (Phase 4)
│   └── apply/                  # Python/FastAPI — draft gen + Playwright
├── web/                        # Next.js 14 + Tailwind frontend
├── docker-compose.yml          # Full stack: Postgres + all services + frontend
├── .env.example
└── README.md
```

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Backend (data services) | Java 21, Spring Boot 3.3 | Daily-driver stack; mature Kafka/JPA/Security ergonomics |
| Backend (apply service) | Python 3.11, FastAPI | Playwright and LLM SDKs are first-class in Python |
| Storage (transactional) | Postgres + pgvector | Single store for relational data and embeddings |
| Storage (cache, throttle) | Redis | Crawler dedup keys, per-domain rate limit tokens |
| Storage (blobs) | S3-compatible | Resumes, generated variants, submission screenshots |
| Browser automation | Playwright (Python) | Tier 2 submission for non-API ATSes |
| LLM | Claude (Anthropic API) | Drafting, salary normalization, email classification |
| Frontend | Next.js 14, Tailwind | Fast iteration; design system maps cleanly to components |
| Migrations | Flyway | SQL-first, version-controlled schema |
| Resume parsing | Apache Tika 2.9 | Handles PDF and DOCX without format-specific code |
| Local infra | Docker Compose | One-command bring-up of all services |
| CI | GitHub Actions | Standard |

## Status and limitations

**This is a portfolio project.** It is not a hosted product, has no waitlist, and is not accepting users.

**Known limitations and explicit non-goals:**

- Single-user in Phase 1. No multi-tenancy.
- No mobile app. Mobile web is a stacked fallback, not a designed experience.
- LinkedIn discovery excluded due to legal risk (hiQ v. LinkedIn). Referral feature uses manual export only.
- Nothing auto-submits without human review in Phase 1. The kill switch always halts automation.
- Targets remote, USD-paying roles. INR-only or India-only roles are out of scope.

## Contributing

I'm not actively soliciting contributions while Phase 2 is in flight, but if you have ideas, found a bug, or want to discuss the design:

- Open a [GitHub issue](https://github.com/srshubham77/jobagent/issues) — bug reports, feature ideas, architecture questions all welcome
- For larger discussions, start a [Discussion](https://github.com/srshubham77/jobagent/discussions)
- PRs are welcome but please open an issue first to discuss scope

If you want to fork and run your own instance: go for it. The license permits it.

## License

MIT — see [LICENSE](LICENSE).

## Acknowledgments

- Architecture and product decisions documented in [docs/decisions/](docs/decisions/).
- UI design built with [Claude Design](https://claude.ai/design); design tokens and screen briefs in [docs/design-briefs.md](docs/design-briefs.md).

---

<div align="center">
<sub>Built by <a href="https://github.com/srshubham77">srshubham77</a> · <a href="docs/PRD.md">PRD</a> · <a href="docs/architecture.md">Architecture</a></sub>
</div>
