import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select

from apply.api.deps import current_user_id, get_db
from apply.db.models import Application, Job, UserPreferences
from apply.schemas.apply import SubmitResult
from apply.services.submission.router import route_and_submit

router = APIRouter(prefix="/submit", tags=["submit"])


@router.post("/{application_id}", response_model=SubmitResult)
async def submit_application(
    application_id: uuid.UUID,
    user_id: Annotated[uuid.UUID, Depends(current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SubmitResult:
    # Kill switch check — read from DB so the UI toggle takes effect immediately
    prefs_result = await db.execute(
        select(UserPreferences).where(UserPreferences.user_id == user_id)
    )
    prefs = prefs_result.scalar_one_or_none()
    if prefs is not None and not prefs.agent_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Agent is paused. Re-enable via the kill switch before submitting.",
        )

    application = await db.get(Application, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if application.status != "drafted":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Application must be in 'drafted' status to submit (current: {application.status})",
        )

    job = await db.get(Job, application.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    outcome = await route_and_submit(application, job)

    if outcome.status == "submitted":
        application.status = "applied"
        application.submitted_at = datetime.now(UTC)
        await db.commit()

    return SubmitResult(
        application_id=application_id,
        method=outcome.method,
        status=outcome.status,
        message=outcome.message,
        screenshot_b64=outcome.screenshot_b64,
    )
