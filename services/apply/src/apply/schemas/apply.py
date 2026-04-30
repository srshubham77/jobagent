import uuid
from datetime import datetime

from pydantic import BaseModel


class DraftRequest(BaseModel):
    job_id: uuid.UUID


class AnswerOut(BaseModel):
    id: uuid.UUID
    question: str
    original_answer: str
    edited_answer: str | None

    model_config = {"from_attributes": True}


class AnswerPatch(BaseModel):
    edited_answer: str


class ApplicationOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    job_id: uuid.UUID
    profile_id: uuid.UUID
    status: str
    closed_tag: str | None
    cover_letter: str | None
    resume_variant: dict
    submitted_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DraftOut(BaseModel):
    application: ApplicationOut
    answers: list[AnswerOut]


class DraftSummary(BaseModel):
    """Lightweight view used by the approval queue list endpoint."""
    id: uuid.UUID
    job_id: uuid.UUID
    status: str
    cover_letter_preview: str | None  # first 200 chars
    answer_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class SubmitResult(BaseModel):
    application_id: uuid.UUID
    method: str          # "greenhouse_api" | "lever_api" | "playwright" | "manual"
    status: str          # "submitted" | "manual_required" | "failed"
    message: str | None
    screenshot_b64: str | None = None


class ApplicationListItem(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    job_title: str
    job_company: str
    job_location: str | None
    job_apply_url: str | None
    job_salary_mode: str
    job_salary_min_usd: int | None
    job_salary_max_usd: int | None
    job_salary_raw: str | None
    job_tier: int
    job_posted_at: datetime | None
    status: str
    closed_tag: str | None
    submitted_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class StatusPatch(BaseModel):
    status: str
    closed_tag: str | None = None
