"""
Greenhouse API submitter (Tier 1).

Greenhouse's Job Board API is public-read; applications require a POST to their
harvest API using a board token embedded in the apply URL.
Endpoint: POST https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs/{job_id}

We extract the board token and job ID from the apply URL pattern:
  https://boards.greenhouse.io/{board_token}/jobs/{job_id}
"""

import logging
import re

import httpx

from apply.db.models import Application, Job
from apply.services.submission.base import Submitter, SubmissionOutcome

logger = logging.getLogger(__name__)

_URL_PATTERN = re.compile(
    r"greenhouse\.io/(?:embed/job_app\?|)(?:token=)?([^/&?]+)(?:/jobs?/|.*job_id=)(\d+)",
    re.IGNORECASE,
)


class GreenhouseSubmitter(Submitter):
    async def submit(self, application: Application, job: Job) -> SubmissionOutcome:
        match = _URL_PATTERN.search(job.apply_url or "")
        if not match:
            return SubmissionOutcome(
                method="greenhouse_api",
                status="manual_required",
                message="Could not extract board token from apply URL",
            )

        board_token, gh_job_id = match.group(1), match.group(2)
        variant = application.resume_variant or {}
        contact = variant.get("contact", {})

        payload = {
            "first_name": _first(contact.get("name", "")),
            "last_name": _last(contact.get("name", "")),
            "email": contact.get("email", ""),
            "phone": contact.get("phone", ""),
            "cover_letter": application.cover_letter or "",
            "resume_content": application.resume_variant.get("raw_text", ""),
            "resume_content_filename": "resume.txt",
            "resume_content_type": "text/plain",
        }

        url = f"https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs/{gh_job_id}"
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.post(url, json=payload)

            if resp.status_code in (200, 201):
                return SubmissionOutcome(method="greenhouse_api", status="submitted")

            logger.warning("Greenhouse API returned %s: %s", resp.status_code, resp.text[:200])
            return SubmissionOutcome(
                method="greenhouse_api",
                status="failed",
                message=f"HTTP {resp.status_code}",
            )

        except Exception as exc:
            logger.error("Greenhouse submission failed: %s", exc)
            return SubmissionOutcome(
                method="greenhouse_api", status="failed", message=str(exc)
            )


def _first(name: str) -> str:
    parts = name.strip().split()
    return parts[0] if parts else ""


def _last(name: str) -> str:
    parts = name.strip().split()
    return " ".join(parts[1:]) if len(parts) > 1 else ""
