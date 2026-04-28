# Claude Code instructions for JobAgent

This file is loaded into context at the start of every Claude Code session in this repo. It's the single source of truth for project conventions, scope, and how to work effectively here.

## What this project is

JobAgent is an AI agent that finds remote, USD-paying engineering jobs and applies on the user's behalf. Full product spec is in [docs/PRD.md](docs/PRD.md). Read it before starting non-trivial work.

**Optimization target:** offers received per unit of candidate time, not applications submitted. When making feature tradeoffs, evaluate against this — not application volume, not feature count.

## Status

Phase 1 (MVP) is in progress. Phases 2-4 are scoped but not started. See the Roadmap section in [README.md](README.md) for what's in each phase.

**Do not work on Phase 2+ features unless explicitly asked.** It's tempting to build ahead, but Phase 1 has clear scope and we need to ship it first.

## Architecture overview

Hybrid Java + Python microservices with Kafka, Postgres + pgvector, Redis, S3-compatible object store, and a Next.js frontend.

Seven services:

- **Profile** (Java/Spring Boot) — resume parsing, profile CRUD, versioning, story bank
- **Discovery** (Java/Spring Boot) — crawlers, deduper, salary normalizer
- **Matcher** (Java/Spring Boot) — fit scoring
- **Network** (Java/Spring Boot) — LinkedIn connection lookup, referral paths (Phase 3)
- **Apply** (Python/FastAPI) — draft generation, resume tailoring, Playwright submission
- **Tracker** (Java/Spring Boot) — email ingestion, classification, state transitions (Phase 2)
- **Analytics** (Java/Spring Boot) — funnel rollups (Phase 4)

The Apply service is in Python because Playwright and the Anthropic SDK are first-class there. Everything else is Java. This is intentional — don't propose unifying the stack unless there's a strong reason.

Full architecture in [docs/architecture.svg](docs/architecture.svg).

## Repo structure

```
jobagent/
├── docs/                       # PRD, architecture, ADRs, design briefs
├── services/
│   ├── profile/                # Java/Spring Boot
│   ├── discovery/              # Java/Spring Boot
│   ├── matcher/                # Java/Spring Boot
│   ├── network/                # Java/Spring Boot
│   ├── tracker/                # Java/Spring Boot
│   ├── analytics/              # Java/Spring Boot
│   └── apply/                  # Python/FastAPI
├── web/                        # Next.js + Tailwind + shadcn/ui
├── infra/                      # Docker Compose, K8s manifests, CI
└── CLAUDE.md                   # This file
```

## Conventions

### Code style

**Java services:**
- Java 21, Spring Boot 3.x
- Maven multi-module or Gradle (TBD — pick whichever I'm using when you see the first service)
- Lombok is OK
- Use Spring's `@Configuration` + `@ConfigurationProperties` for typed config, never raw `@Value` for non-trivial config
- Records for DTOs where possible
- Constructor injection always — no `@Autowired` on fields

**Python service (Apply):**
- Python 3.11+
- FastAPI + Pydantic v2
- `uv` for dependency management (faster than pip)
- `ruff` for linting and formatting
- Type hints everywhere

**Frontend:**
- Next.js 14 App Router
- Tailwind + shadcn/ui
- Server Components by default; Client Components only when needed (interactivity, hooks)
- Design tokens are documented in [docs/design-briefs.md](docs/design-briefs.md). Match the design system — warm cream/terracotta palette, Inter, JetBrains Mono for technical metadata.

### Naming

- `kebab-case` for service directory names
- `PascalCase` for Java classes, `camelCase` for methods
- `snake_case` for Python
- `kebab-case` for npm package scripts
- Database tables and columns: `snake_case`

### Commit messages

Conventional Commits format:

```
feat(profile): add resume parsing endpoint
fix(discovery): handle empty RemoteOK response
docs(prd): clarify salary normalization rules
```

Scope is the service name (`profile`, `discovery`, `apply`, `web`) or `docs` / `infra`.

### Tests

- Java: JUnit 5 + AssertJ + Testcontainers for integration tests
- Python: pytest + pytest-asyncio
- Frontend: Vitest for unit, Playwright for E2E (later)
- Don't write tests for trivial getters/setters. Do write tests for: parsers, scoring logic, classifiers, state machines, salary normalization.

## Hard rules

These are non-negotiable per the PRD and ADRs in [docs/decisions/](docs/decisions/):

1. **Nothing auto-submits applications without human review in v1.** Every submission goes through an approval gate. The kill switch in the UI must always be wired to actually halt automation.
2. **No direct LinkedIn scraping.** Network feature uses manual LinkedIn data export only.
3. **No multi-LLM-provider abstraction.** Built for Claude. Don't add abstraction layers "just in case."
4. **No fabrication in resume tailoring.** Keywords are only swapped in if they truthfully apply, drawn from the user's profile/story bank — never invented.
5. **Email content is processed in-memory.** Only metadata + classification result persisted. Never store full email bodies.
6. **PII encrypted at rest.** Resume text, story bank entries, OAuth tokens, scraped recruiter contacts.

If a request would violate any of these, push back and explain why.

## How I work

- I'm a backend engineer with 6+ years experience. You don't need to over-explain Java/Spring Boot or basic distributed systems concepts. Do explain Playwright, pgvector, and Next.js App Router specifics if relevant.
- I prefer concrete code over long explanations. If you're proposing an approach, write the code.
- When making nontrivial decisions, surface the tradeoff briefly before committing to one option.
- Match my commit style and naming conventions when generating code.
- For changes spanning multiple files, propose the plan first, then execute.

## What's already done

- PRD finalized (v2.0)
- Architecture diagram and service breakdown
- Design system + UI kit (6 screens) generated in Claude Design — see [docs/design-briefs.md](docs/design-briefs.md)
- Notion workspace with PRD, architecture page, decisions log, and a tasks database

## Where to find things

- **PRD:** [docs/PRD.md](docs/PRD.md)
- **Architecture diagram:** [docs/architecture.svg](docs/architecture.svg)
- **Design briefs and tokens:** [docs/design-briefs.md](docs/design-briefs.md)
- **ADRs:** [docs/decisions/](docs/decisions/) (when present)
- **Tasks:** Notion workspace (not in repo)

## First useful tasks

If you're starting a new session and don't have a specific instruction, the highest-leverage Phase 1 tasks right now are:

1. Bootstrap the monorepo structure (services/profile, services/discovery, services/apply, web/, infra/, docker-compose.yml)
2. Set up the Postgres schema for User, Profile, Story, Job, Application — see the data model in [docs/PRD.md](docs/PRD.md) §9
3. Implement the Profile service: resume upload + parsing + structured profile CRUD
4. Implement the RemoteOK crawler in the Discovery service
5. Implement the salary normalization pipeline (the LLM-classification piece is in the Apply service; the structured rules live in Discovery)

Don't do all of these in one session. Pick one, scope it tightly, get it working, commit.