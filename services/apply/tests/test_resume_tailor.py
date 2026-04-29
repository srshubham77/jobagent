from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from apply.db.models import Job, Profile
from apply.services.resume_tailor import ResumeTailor


def _make_response(text: str):
    r = MagicMock()
    r.content = [MagicMock(text=text)]
    return r


VALID_VARIANT = """{
  "summary": "Tailored summary for Linear.",
  "experience": [
    {
      "company": "Acme Corp",
      "title": "Senior Backend Engineer",
      "startDate": "2021-01",
      "endDate": "present",
      "bullets": ["Led Kafka pipeline migration at scale."]
    }
  ],
  "skills": ["Kafka", "Java", "Spring Boot", "PostgreSQL"],
  "changes": ["Moved Kafka bullet to first position to match JD emphasis."]
}"""


@pytest.fixture
def tailor():
    with patch("apply.services.resume_tailor.anthropic.AsyncAnthropic"):
        t = ResumeTailor()
        t._client = MagicMock()
        t._client.messages = MagicMock()
        t._client.messages.create = AsyncMock(return_value=_make_response(VALID_VARIANT))
        return t


async def test_tailor_returns_valid_variant(tailor: ResumeTailor, sample_job: Job, sample_profile: Profile):
    result = await tailor.tailor(sample_job, sample_profile)
    assert result["summary"] == "Tailored summary for Linear."
    assert len(result["changes"]) > 0
    # contact and education always preserved
    assert "contact" in result
    assert "education" in result


async def test_tailor_sends_profile_json_to_claude(
    tailor: ResumeTailor, sample_job: Job, sample_profile: Profile
):
    await tailor.tailor(sample_job, sample_profile)
    call_kwargs = tailor._client.messages.create.call_args.kwargs
    user_content = call_kwargs["messages"][0]["content"]
    assert "Acme Corp" in user_content
    assert "Java" in user_content


async def test_tailor_falls_back_on_bad_json(
    tailor: ResumeTailor, sample_job: Job, sample_profile: Profile
):
    tailor._client.messages.create = AsyncMock(
        return_value=_make_response("this is not json")
    )
    result = await tailor.tailor(sample_job, sample_profile)
    assert result["changes"] == ["Tailoring failed; using original profile"]
    assert result["skills"] == sample_profile.skills


async def test_tailor_no_fabrication_in_system_prompt(
    tailor: ResumeTailor, sample_job: Job, sample_profile: Profile
):
    await tailor.tailor(sample_job, sample_profile)
    system_prompt = tailor._client.messages.create.call_args.kwargs["system"]
    assert "fabricat" in system_prompt.lower() or "invent" in system_prompt.lower()
