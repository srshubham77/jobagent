"""
Lever API submitter (Tier 1).

Lever's public apply endpoint:
  POST https://api.lever.co/v0/postings/{posting_id}/apply

The posting ID lives in the apply URL:
  https://jobs.lever.co/{company}/{posting_id}
  https://jobs.lever.co/{company}/{posting_id}/apply
"""

import logging
import re

import httpx

from apply.db.models import Application, Job
from apply.services.submission.base import Submitter, SubmissionOutcome

logger = logging.getLogger(__name__)

_URL_PATTERN = re.compile(
    r"lever\.co/[^/]+/([0-9a-f-]{36})", re.IGNORECASE
)


class LeverSubmitter(Submitter):
    async def submit(self, application: Application, job: Job) -> SubmissionOutcome:
        match = _URL_PATTERN.search(job.apply_url or "")
        if not match:
            return SubmissionOutcome(
                method="lever_api",
                status="manual_required",
                message="Could not extract posting ID from apply URL",
            )

        posting_id = match.group(1)
        variant = application.resume_variant or {}
        contact = variant.get("contact", {})
        name = contact.get("name", "")

        payload = {
            "name": name,
            "email": contact.get("email", ""),
            "phone": contact.get("phone", ""),
            "org": "",
            "urls": {},
            "comments": application.cover_letter or "",
            "silent": False,
        }

        url = f"https://api.lever.co/v0/postings/{posting_id}/apply"
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                resp = await client.post(url, json=payload)

            if resp.status_code in (200, 201):
                return SubmissionOutcome(method="lever_api", status="submitted")

            logger.warning("Lever API returned %s: %s", resp.status_code, resp.text[:200])
            return SubmissionOutcome(
                method="lever_api",
                status="failed",
                message=f"HTTP {resp.status_code}",
            )

        except Exception as exc:
            logger.error("Lever submission failed: %s", exc)
            return SubmissionOutcome(
                method="lever_api", status="failed", message=str(exc)
            )
