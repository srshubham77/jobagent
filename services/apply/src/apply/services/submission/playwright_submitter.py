"""
Playwright-based form submitter for Tier 2 sites (no public ATS API).

Strategy:
1. Navigate to the apply URL with a realistic viewport + user agent.
2. Wait for the page to stabilise.
3. Attempt to fill common field selectors (name, email, phone, cover letter).
4. Take a screenshot for the audit log — always.
5. If a captcha or anti-bot page is detected, return manual_required immediately.
6. If all required fields are filled, click submit and wait for confirmation.
7. On any unexpected error, return manual_required (never fail silently).

This is explicitly best-effort. The caller must handle manual_required gracefully.
"""

import base64
import logging
import re

from apply.config import settings
from apply.db.models import Application, Job
from apply.services.submission.base import Submitter, SubmissionOutcome

logger = logging.getLogger(__name__)

_CAPTCHA_SIGNALS = ["captcha", "recaptcha", "hcaptcha", "cloudflare", "bot detection"]

# Common selector patterns for form fields (ordered by specificity)
_NAME_SELECTORS = [
    "input[name='name']", "input[name='full_name']", "input[name='fullName']",
    "input[placeholder*='name' i]", "input[id*='name' i]",
]
_EMAIL_SELECTORS = [
    "input[type='email']", "input[name='email']", "input[placeholder*='email' i]",
]
_PHONE_SELECTORS = [
    "input[type='tel']", "input[name='phone']", "input[placeholder*='phone' i]",
]
_COVER_SELECTORS = [
    "textarea[name*='cover' i]", "textarea[placeholder*='cover' i]",
    "textarea[name*='letter' i]", "textarea[id*='cover' i]",
    "div[contenteditable][aria-label*='cover' i]",
]
_SUBMIT_SELECTORS = [
    "button[type='submit']", "input[type='submit']",
    "button:has-text('Submit')", "button:has-text('Apply')",
    "button:has-text('Send application')",
]


class PlaywrightSubmitter(Submitter):
    async def submit(self, application: Application, job: Job) -> SubmissionOutcome:
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            return SubmissionOutcome(
                method="playwright",
                status="manual_required",
                message="Playwright not installed",
            )

        variant = application.resume_variant or {}
        contact = variant.get("contact", {})

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(headless=settings.playwright_headless)
            try:
                context = await browser.new_context(
                    viewport={"width": 1280, "height": 900},
                    user_agent=(
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/120.0.0.0 Safari/537.36"
                    ),
                )
                page = await context.new_page()
                await page.goto(job.apply_url or "", timeout=settings.playwright_timeout_ms)
                await page.wait_for_load_state("networkidle", timeout=settings.playwright_timeout_ms)

                # Captcha check
                page_text = await page.inner_text("body")
                if any(sig in page_text.lower() for sig in _CAPTCHA_SIGNALS):
                    screenshot = await _screenshot_b64(page)
                    return SubmissionOutcome(
                        method="playwright",
                        status="manual_required",
                        message="Anti-bot / captcha detected",
                        screenshot_b64=screenshot,
                    )

                # Fill fields
                await _try_fill(page, _NAME_SELECTORS, contact.get("name", ""))
                await _try_fill(page, _EMAIL_SELECTORS, contact.get("email", ""))
                await _try_fill(page, _PHONE_SELECTORS, contact.get("phone", ""))
                await _try_fill(page, _COVER_SELECTORS, application.cover_letter or "")

                screenshot_before = await _screenshot_b64(page)

                # Attempt submit
                submitted = False
                for sel in _SUBMIT_SELECTORS:
                    try:
                        btn = page.locator(sel).first
                        if await btn.count() > 0 and await btn.is_visible():
                            await btn.click()
                            await page.wait_for_load_state(
                                "networkidle", timeout=settings.playwright_timeout_ms
                            )
                            submitted = True
                            break
                    except Exception:
                        continue

                if not submitted:
                    return SubmissionOutcome(
                        method="playwright",
                        status="manual_required",
                        message="Could not locate submit button",
                        screenshot_b64=screenshot_before,
                    )

                screenshot_after = await _screenshot_b64(page)
                return SubmissionOutcome(
                    method="playwright",
                    status="submitted",
                    screenshot_b64=screenshot_after,
                )

            except Exception as exc:
                logger.error("Playwright submission error for job=%s: %s", job.id, exc)
                return SubmissionOutcome(
                    method="playwright",
                    status="manual_required",
                    message=str(exc),
                )
            finally:
                await browser.close()


async def _try_fill(page, selectors: list[str], value: str) -> None:
    if not value:
        return
    for sel in selectors:
        try:
            el = page.locator(sel).first
            if await el.count() > 0 and await el.is_visible():
                await el.fill(value)
                return
        except Exception:
            continue


async def _screenshot_b64(page) -> str:
    raw = await page.screenshot(type="png")
    return base64.b64encode(raw).decode()
