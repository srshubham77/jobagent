import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apply.api.deps import current_user_id, get_db
from apply.db.models import Application, Job
from apply.schemas.apply import ApplicationListItem, StatusPatch

router = APIRouter(prefix="/applications", tags=["applications"])

_VALID_STATUSES = {"discovered", "drafted", "applied", "active", "closed"}


@router.get("", response_model=list[ApplicationListItem])
async def list_applications(
    user_id: Annotated[uuid.UUID, Depends(current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[ApplicationListItem]:
    result = await db.execute(
        select(Application)
        .where(Application.user_id == user_id)
        .order_by(Application.created_at.desc())
    )
    applications = list(result.scalars())

    items = []
    for app in applications:
        job = await db.get(Job, app.job_id)
        if not job:
            continue
        items.append(ApplicationListItem(
            id=app.id,
            job_id=app.job_id,
            job_title=job.title,
            job_company=job.company,
            job_location=job.location,
            job_apply_url=job.apply_url,
            job_salary_mode=job.salary_mode,
            job_salary_min_usd=job.salary_min_usd,
            job_salary_max_usd=job.salary_max_usd,
            job_salary_raw=job.salary_raw,
            job_tier=job.tier,
            job_posted_at=job.posted_at,
            status=app.status,
            closed_tag=app.closed_tag,
            submitted_at=app.submitted_at,
            created_at=app.created_at,
        ))
    return items


@router.patch("/{application_id}", response_model=ApplicationListItem)
async def update_application(
    application_id: uuid.UUID,
    body: StatusPatch,
    user_id: Annotated[uuid.UUID, Depends(current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ApplicationListItem:
    if body.status not in _VALID_STATUSES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid status '{body.status}'. Valid: {sorted(_VALID_STATUSES)}",
        )

    app = await db.get(Application, application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    app.status = body.status
    app.closed_tag = body.closed_tag
    await db.commit()
    await db.refresh(app)

    job = await db.get(Job, app.job_id)
    return ApplicationListItem(
        id=app.id,
        job_id=app.job_id,
        job_title=job.title if job else "",
        job_company=job.company if job else "",
        job_location=job.location if job else None,
        job_apply_url=job.apply_url if job else None,
        job_salary_mode=job.salary_mode if job else "unstated",
        job_salary_min_usd=job.salary_min_usd if job else None,
        job_salary_max_usd=job.salary_max_usd if job else None,
        job_salary_raw=job.salary_raw if job else None,
        job_tier=job.tier if job else 3,
        job_posted_at=job.posted_at if job else None,
        status=app.status,
        closed_tag=app.closed_tag,
        submitted_at=app.submitted_at,
        created_at=app.created_at,
    )
