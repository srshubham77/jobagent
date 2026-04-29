import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from apply.db.models import Job, Profile, Story


@pytest.fixture
def sample_profile() -> Profile:
    p = Profile()
    p.id = uuid.uuid4()
    p.user_id = uuid.uuid4()
    p.version_number = 1
    p.is_current = True
    p.summary = "Senior backend engineer with 7 years building distributed systems."
    p.skills = ["Java", "Spring Boot", "Kafka", "PostgreSQL", "Kubernetes"]
    p.experience = [
        {
            "company": "Acme Corp",
            "title": "Senior Backend Engineer",
            "startDate": "2021-01",
            "endDate": "present",
            "bullets": [
                "Led migration from monolith to microservices, reducing deploy time by 60%",
                "Designed Kafka-based event pipeline processing 1M events/day",
            ],
        }
    ]
    p.education = []
    p.contact = {"name": "Jane Doe", "email": "jane@example.com"}
    p.projects = []
    p.certifications = []
    return p


@pytest.fixture
def sample_job() -> Job:
    j = Job()
    j.id = uuid.uuid4()
    j.external_id = "remoteok-123"
    j.source = "remoteok"
    j.title = "Senior Backend Engineer"
    j.company = "Linear"
    j.location = "Remote"
    j.remote = True
    j.salary_mode = "usd_explicit"
    j.salary_min_usd = 160_000
    j.salary_max_usd = 220_000
    j.salary_raw = "$160k-$220k"
    j.jd_body = (
        "We are looking for a Senior Backend Engineer to join our team. "
        "You will work on our distributed infrastructure using Java, Kafka, and PostgreSQL. "
        "5+ years of experience required. Salary: $160k-$220k."
    )
    j.apply_url = "https://jobs.lever.co/linear/abc-123-def"
    j.tier = 1
    return j


@pytest.fixture
def sample_stories() -> list[Story]:
    s = Story()
    s.id = uuid.uuid4()
    s.user_id = uuid.uuid4()
    s.title = "Microservices Migration"
    s.situation = "Our monolith was causing 4-hour deploy cycles."
    s.action = "I designed a strangler-fig migration plan and led a team of 4 engineers."
    s.result = "Deploy time reduced from 4 hours to 15 minutes."
    s.metrics = "60% reduction in deploy time, zero downtime migration"
    s.themes = ["technical depth", "scale", "leadership"]
    s.variants = {}
    return [s]


@pytest.fixture
def mock_anthropic_client():
    """Returns a factory that patches AsyncAnthropic with canned responses."""
    client = MagicMock()
    client.messages = MagicMock()
    client.messages.create = AsyncMock()
    return client
