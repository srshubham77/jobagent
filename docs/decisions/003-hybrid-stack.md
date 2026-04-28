# ADR-003: Hybrid stack — Java for data services, Python for the Apply service

**Status:** Accepted
**Date:** 2026-04-26

## Context

The system has seven services. Six are largely orthogonal data plumbing — crawling, deduplicating, scoring, classifying emails, rolling up funnel events. One (Apply) is built around two heavy dependencies: Playwright for browser automation, and the Anthropic SDK for LLM calls.

I'm a backend engineer with 6+ years of daily Java/Spring Boot experience. Spring's ergonomics around Kafka, JPA, Spring Security, and Resilience4j are familiar and productive. The data services are the kind of work I've been doing professionally — straightforward to build well in Java.

The Apply service is different. Playwright's Python bindings are first-class; its Node bindings are too, but I'd be context-switching between Java and Node. The Anthropic SDK has parity across languages but the Python SDK is more idiomatic and has better examples for the kinds of agent patterns this service needs.

## Options considered

1. **All Java.** Use Playwright's Java bindings, call the Anthropic API via its Java SDK. Single runtime, single dependency manager.
2. **All Python.** Build everything in FastAPI. Lose Spring's ecosystem advantages for the data services.
3. **Hybrid.** Java for data services, Python for Apply.

## Decision

Hybrid: Java/Spring Boot for Profile, Discovery, Matcher, Network, Tracker, Analytics. Python/FastAPI for Apply. They communicate via Kafka.

## Rationale

The two heavy dependencies in Apply (Playwright + LLM tooling) are friendlier in Python by enough margin to justify the runtime split. The data services don't benefit from being in Python — Java's static typing, Spring's wiring, and the JVM's operational maturity are all advantages for the kind of work they do.

Kafka as the inter-service boundary makes the language difference invisible to the rest of the system. A Python service publishing to `applications.events` looks identical to a Java service publishing to the same topic.

## Consequences

**Two runtimes to maintain.** Two Dockerfiles, two CI pipelines, two dependency files (`build.gradle.kts` and `pyproject.toml`). Manageable cost.

**Best tool for each job.** The data services get Spring's ergonomics. The Apply service gets Playwright + the Anthropic SDK without translation overhead.

**Hiring/onboarding stays clean.** Anyone who reads the repo can pick up either side based on their stack preference. The split is defensible and not arbitrary.

**Don't unify later "for consistency."** A future contributor will be tempted to argue "we should pick one stack." This is intentional, not legacy. Don't regress.
