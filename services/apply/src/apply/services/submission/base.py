from abc import ABC, abstractmethod
from dataclasses import dataclass

from apply.db.models import Application, Job


@dataclass
class SubmissionOutcome:
    method: str
    status: str          # "submitted" | "manual_required" | "failed"
    message: str | None = None
    screenshot_b64: str | None = None


class Submitter(ABC):
    @abstractmethod
    async def submit(self, application: Application, job: Job) -> SubmissionOutcome:
        ...
