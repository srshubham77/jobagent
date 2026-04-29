from apply.db.models import Application, Job
from apply.services.submission.base import SubmissionOutcome
from apply.services.submission.greenhouse import GreenhouseSubmitter
from apply.services.submission.lever import LeverSubmitter
from apply.services.submission.playwright_submitter import PlaywrightSubmitter

_greenhouse = GreenhouseSubmitter()
_lever = LeverSubmitter()
_playwright = PlaywrightSubmitter()


async def route_and_submit(application: Application, job: Job) -> SubmissionOutcome:
    """
    Route to the appropriate submitter based on job tier and apply URL.
    Tier 1 → ATS API (Greenhouse / Lever).
    Tier 2 → Playwright (best-effort).
    Tier 3 → manual (return payload without submitting).
    """
    url = (job.apply_url or "").lower()

    if job.tier == 1:
        if "greenhouse.io" in url:
            result = await _greenhouse.submit(application, job)
            if result.status != "failed":
                return result
        if "lever.co" in url:
            result = await _lever.submit(application, job)
            if result.status != "failed":
                return result

    if job.tier in (1, 2):
        return await _playwright.submit(application, job)

    # Tier 3 — manual
    return SubmissionOutcome(
        method="manual",
        status="manual_required",
        message="Tier 3 job — manual submission required. Draft has been prepared.",
    )
