"""
Generates cover letter and per-question answers for a job application.

All generated content is grounded in the candidate's actual profile and story bank.
The system prompt explicitly forbids fabrication — Claude may only use information
provided in the context.
"""

import json
import logging

import anthropic

from apply.config import settings
from apply.db.models import Job, Profile, Story

logger = logging.getLogger(__name__)

_COVER_LETTER_SYSTEM = """
You write tailored job application cover letters. You must follow these rules strictly:

1. Use ONLY information provided in the candidate profile. Do NOT invent achievements,
   technologies, or experience that are not in the profile.
2. Mirror the language and tone of the job description where it truthfully applies.
3. Be concise — 3-4 short paragraphs maximum.
4. Do NOT use generic filler phrases ("I am excited to apply...", "I believe I am
   a strong candidate..."). Lead with a specific, relevant accomplishment.
5. Output ONLY the cover letter text. No subject line, no "Dear Hiring Manager",
   no signature. Just the body paragraphs.
""".strip()

_ANSWER_SYSTEM = """
You write answers to job application questions on behalf of a candidate.

Rules:
1. Use ONLY the information in the candidate profile and story bank provided.
   Do NOT invent, exaggerate, or fabricate any detail.
2. Draw from the most relevant story from the story bank when answering behavioral
   questions (STAR format: Situation, Action, Result).
3. Match the requested word count if specified in the question.
4. Output ONLY a JSON array of objects, one per question:
   [{"question": "...", "answer": "..."}]
   No other text, no markdown fences.
""".strip()


class DraftGenerator:
    def __init__(self) -> None:
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def generate_cover_letter(self, job: Job, profile: Profile) -> str:
        profile_ctx = _build_profile_context(profile)
        user_msg = f"""
Job title: {job.title}
Company: {job.company}
Job description:
{(job.jd_body or '')[:2000]}

Candidate profile:
{profile_ctx}

Write a tailored cover letter for this candidate.
""".strip()

        msg = await self._client.messages.create(
            model=settings.anthropic_model,
            max_tokens=1024,
            system=_COVER_LETTER_SYSTEM,
            messages=[{"role": "user", "content": user_msg}],
        )
        return msg.content[0].text.strip()

    async def generate_answers(
        self,
        job: Job,
        profile: Profile,
        stories: list[Story],
        questions: list[str],
    ) -> list[dict[str, str]]:
        if not questions:
            return []

        profile_ctx = _build_profile_context(profile)
        story_ctx = _build_story_context(stories)

        user_msg = f"""
Job title: {job.title}
Company: {job.company}

Candidate profile:
{profile_ctx}

Story bank (use these for behavioral questions):
{story_ctx}

Questions to answer:
{json.dumps(questions, indent=2)}
""".strip()

        msg = await self._client.messages.create(
            model=settings.anthropic_model,
            max_tokens=settings.anthropic_max_tokens,
            system=_ANSWER_SYSTEM,
            messages=[{"role": "user", "content": user_msg}],
        )

        raw = msg.content[0].text.strip()
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("Failed to parse answer JSON; returning raw as single answer")
            return [{"question": questions[0], "answer": raw}]


# ── common screening questions applied to every application ──────────────────

COMMON_QUESTIONS = [
    "Why are you interested in this role?",
    "What is your expected compensation?",
    "Are you authorized to work in the US without sponsorship?",
    "When can you start?",
]


def _build_profile_context(profile: Profile) -> str:
    parts = []
    if profile.summary:
        parts.append(f"Summary: {profile.summary}")
    if profile.skills:
        parts.append(f"Skills: {', '.join(profile.skills[:30])}")
    if profile.experience:
        exp_lines = []
        for e in profile.experience[:5]:
            title = e.get("title", "")
            company = e.get("company", "")
            start = e.get("startDate", "")
            end = e.get("endDate", "present")
            bullets = e.get("bullets", [])[:3]
            exp_lines.append(f"  {title} at {company} ({start}–{end})")
            for b in bullets:
                exp_lines.append(f"    • {b}")
        parts.append("Experience:\n" + "\n".join(exp_lines))
    return "\n\n".join(parts)


def _build_story_context(stories: list[Story]) -> str:
    if not stories:
        return "(no stories in bank)"
    lines = []
    for s in stories[:5]:
        themes = ", ".join(s.themes or [])
        lines.append(
            f"[{s.title}] themes={themes}\n"
            f"  S: {s.situation[:200]}\n"
            f"  A: {s.action[:200]}\n"
            f"  R: {s.result[:200]}"
        )
    return "\n\n".join(lines)
