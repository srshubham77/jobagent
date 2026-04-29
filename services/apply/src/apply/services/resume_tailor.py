"""
Generates a JD-tailored resume variant for a specific application.

Constraints (hard, enforced via system prompt):
- Only reorder and rephrase existing bullets — never add new claims.
- Only add JD keywords that truthfully appear in the candidate's existing profile.
- Return a structured diff so the UI can show exactly what changed.
"""

import json
import logging

import anthropic

from apply.config import settings
from apply.db.models import Job, Profile

logger = logging.getLogger(__name__)

_SYSTEM = """
You tailor resumes for specific job applications. You MUST follow these rules:

1. NEVER fabricate or add information not present in the candidate's profile.
   Every bullet, keyword, and claim must be grounded in the provided profile text.
2. You MAY reorder experience bullets to put the most JD-relevant ones first.
3. You MAY rephrase bullets to use JD keywords, but ONLY when the rephrasing
   is still a truthful description of what the candidate actually did.
4. Adjust the summary to mirror the JD framing — still using only real facts.
5. Reorder the skills list so JD-matching skills appear first.
6. Output ONLY a JSON object with this exact schema:
{
  "summary": "tailored summary string",
  "experience": [
    {
      "company": "string",
      "title": "string",
      "startDate": "string or null",
      "endDate": "string or null",
      "bullets": ["bullet1", "bullet2"]
    }
  ],
  "skills": ["skill1", "skill2"],
  "changes": ["human-readable description of what changed and why"]
}
No other text. No markdown fences. Pure JSON only.
""".strip()


class ResumeTailor:
    def __init__(self) -> None:
        self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def tailor(self, job: Job, profile: Profile) -> dict:
        """
        Returns a resume_variant dict ready to store in applications.resume_variant.
        Includes a 'changes' list describing every modification made.
        """
        profile_json = {
            "summary": profile.summary,
            "experience": profile.experience or [],
            "skills": profile.skills or [],
        }

        user_msg = f"""
Job title: {job.title}
Company: {job.company}
Job description:
{(job.jd_body or '')[:3000]}

Candidate profile (JSON):
{json.dumps(profile_json, indent=2)}

Produce a tailored resume variant for this job.
""".strip()

        msg = await self._client.messages.create(
            model=settings.anthropic_model,
            max_tokens=settings.anthropic_max_tokens,
            system=_SYSTEM,
            messages=[{"role": "user", "content": user_msg}],
        )

        raw = msg.content[0].text.strip()
        try:
            variant = json.loads(raw)
        except json.JSONDecodeError:
            logger.error("ResumeTailor: failed to parse Claude response as JSON")
            # Fall back to the original profile as-is (no tailoring)
            return {
                "summary": profile.summary,
                "experience": profile.experience or [],
                "skills": profile.skills or [],
                "changes": ["Tailoring failed; using original profile"],
            }

        # Preserve contact + education unchanged (not modified by tailoring)
        variant["contact"] = profile.contact or {}
        variant["education"] = profile.education or []
        variant.setdefault("changes", [])
        return variant
