# Architectural Decision Records

This folder contains ADRs (Architectural Decision Records) — short documents capturing significant decisions and the reasoning behind them.

Each ADR is numbered, dated, and self-contained. They're written so that someone joining the project in six months can understand *why* a decision was made, not just *what* the decision was.

## Index

| ADR | Title | Status |
|---|---|---|
| [001](001-no-linkedin-scraping.md) | Exclude direct LinkedIn scraping from v1 | Accepted |
| [002](002-offers-not-applications.md) | Optimization target is offers received, not applications submitted | Accepted |
| [003](003-hybrid-stack.md) | Hybrid stack — Java for data services, Python for the Apply service | Accepted |
| [004](004-three-tier-submission.md) | Three-tier submission model | Accepted |
| [005](005-five-pipeline-tabs.md) | Five pipeline tabs, not eight | Accepted |
| [006](006-no-multi-llm-abstraction.md) | No multi-LLM-provider abstraction in v1 | Accepted |

## Adding a new ADR

1. Pick the next number.
2. Use a short, descriptive filename: `NNN-kebab-case-title.md`.
3. Follow the existing template: Status, Date, Context, Decision, Consequences. Add Rationale or Open Questions sections if useful.
4. Commit the ADR alongside any code changes that implement the decision, so the rationale is in the same commit history.

ADRs are immutable once Accepted. If a decision needs to change, write a new ADR that supersedes the old one — don't edit history.
