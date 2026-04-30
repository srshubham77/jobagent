import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from apply.api.deps import current_user_id, get_db
from apply.db.models import Answer, Application, Job, Profile, Story
from apply.schemas.apply import AnswerOut, AnswerPatch, DraftOut, DraftRequest, DraftSummary
from apply.services.draft_generator import COMMON_QUESTIONS, DraftGenerator
from apply.services.resume_tailor import ResumeTailor

router = APIRouter(prefix="/drafts", tags=["drafts"])

_generator = DraftGenerator()
_tailor = ResumeTailor()


@router.get("", response_model=list[DraftSummary])
async def list_drafts(
    user_id: Annotated[uuid.UUID, Depends(current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[DraftSummary]:
    """Approval queue: all applications in 'drafted' status for the current user."""
    result = await db.execute(
        select(Application)
        .where(Application.user_id == user_id, Application.status == "drafted")
        .order_by(Application.created_at.desc())
    )
    applications = list(result.scalars())

    summaries = []
    for app in applications:
        answer_result = await db.execute(
            select(Answer).where(Answer.application_id == app.id)
        )
        answers = list(answer_result.scalars())
        preview = app.cover_letter[:200] if app.cover_letter else None
        summaries.append(DraftSummary(
            id=app.id,
            job_id=app.job_id,
            status=app.status,
            cover_letter_preview=preview,
            answer_count=len(answers),
            created_at=app.created_at,
        ))
    return summaries


@router.post("", response_model=DraftOut, status_code=status.HTTP_201_CREATED)
async def create_draft(
    body: DraftRequest,
    user_id: Annotated[uuid.UUID, Depends(current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DraftOut:
    # Load job
    job = await db.get(Job, body.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Load current profile
    result = await db.execute(
        select(Profile).where(Profile.user_id == user_id, Profile.is_current.is_(True))
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="No profile found — upload a resume first")

    # Duplicate guard
    existing = await db.execute(
        select(Application).where(
            Application.user_id == user_id,
            Application.job_id == body.job_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Application to this job already exists",
        )

    # Fetch relevant stories
    story_result = await db.execute(
        select(Story).where(Story.user_id == user_id).order_by(Story.created_at.desc()).limit(10)
    )
    stories = list(story_result.scalars())

    # Generate content (Claude calls — I/O bound, run concurrently)
    import asyncio

    cover_letter, resume_variant = await asyncio.gather(
        _generator.generate_cover_letter(job, profile),
        _tailor.tailor(job, profile),
    )

    answers_raw = await _generator.generate_answers(job, profile, stories, COMMON_QUESTIONS)

    # Persist application
    application = Application(
        user_id=user_id,
        job_id=job.id,
        profile_id=profile.id,
        status="drafted",
        cover_letter=cover_letter,
        resume_variant=resume_variant,
    )
    db.add(application)
    await db.flush()  # get the ID before adding answers

    answer_rows = [
        Answer(
            application_id=application.id,
            question=a.get("question", ""),
            original_answer=a.get("answer", ""),
        )
        for a in answers_raw
        if a.get("answer")
    ]
    db.add_all(answer_rows)
    await db.commit()
    await db.refresh(application)

    from apply.schemas.apply import ApplicationOut

    return DraftOut(
        application=ApplicationOut.model_validate(application),
        answers=[AnswerOut.model_validate(a) for a in answer_rows],
    )


@router.get("/{application_id}", response_model=DraftOut)
async def get_draft(
    application_id: uuid.UUID,
    user_id: Annotated[uuid.UUID, Depends(current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DraftOut:
    application = await _get_owned(db, application_id, user_id)
    answers = list(
        (
            await db.execute(
                select(Answer).where(Answer.application_id == application_id)
            )
        ).scalars()
    )

    from apply.schemas.apply import ApplicationOut

    return DraftOut(
        application=ApplicationOut.model_validate(application),
        answers=[AnswerOut.model_validate(a) for a in answers],
    )


@router.patch("/{application_id}/answers/{answer_id}", response_model=AnswerOut)
async def patch_answer(
    application_id: uuid.UUID,
    answer_id: uuid.UUID,
    body: AnswerPatch,
    user_id: Annotated[uuid.UUID, Depends(current_user_id)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AnswerOut:
    await _get_owned(db, application_id, user_id)

    answer = await db.get(Answer, answer_id)
    if not answer or answer.application_id != application_id:
        raise HTTPException(status_code=404, detail="Answer not found")

    answer.edited_answer = body.edited_answer
    await db.commit()
    await db.refresh(answer)
    return AnswerOut.model_validate(answer)


async def _get_owned(db: AsyncSession, application_id: uuid.UUID, user_id: uuid.UUID) -> Application:
    app = await db.get(Application, application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if app.user_id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return app
