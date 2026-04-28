# ADR-006: No multi-LLM-provider abstraction in v1

**Status:** Accepted
**Date:** 2026-04-26

## Context

It's tempting to abstract over LLM providers from day one — Claude, GPT, Gemini behind a common interface. The reasoning is "what if pricing changes" or "what if Claude has an outage" or "what if a different model is better for one task."

This is premature abstraction. Three problems with it:

**It costs real time up front.** A clean LLM abstraction is at least a week of work — defining the interface, normalizing prompts across providers (each has different system message conventions, token counting, function-calling formats), handling streaming differences, building a fake/mock for tests. That's a week not spent on actual product.

**Prompts don't actually port.** The myth of provider-agnostic prompts breaks down quickly. A prompt tuned for Claude's behavior often performs poorly on GPT-4 and vice versa. So even with a clean abstraction, you end up maintaining provider-specific prompts. The abstraction protects nothing it claims to protect.

**The "what if" never materializes for solo projects.** For a v1 portfolio project with one user, the probability of needing to swap providers mid-build is low. The cost of swapping later (find-and-replace plus prompt re-tuning) is bounded and known.

The strongest argument for abstraction would be vendor lock-in concerns at company scale. JobAgent is not at that scale.

## Decision

Build for Claude. Use the Anthropic SDK directly. No abstraction layer.

If the project ever needs to swap providers, it's a focused refactor at that point — not a speculative cost paid up front.

## Consequences

**Saves a week of build time.** Used directly on shipping product features.

**Tighter integration with Claude's strengths.** Tool use, prompt caching, message structure, system prompt conventions can all be used idiomatically without flattening to a least-common-denominator interface.

**Vendor lock-in (mild).** If Anthropic raises prices significantly or has a sustained outage, the swap cost is real. Mitigated by: (a) Anthropic SDK call sites are localized in the Apply service (drafting, classification, tailoring); (b) prompts are version-controlled and inspectable; (c) the swap is mechanical, not architectural.

**No "configurable LLM provider" feature.** This is the right answer for v1. The README explicitly lists this as a non-goal.
