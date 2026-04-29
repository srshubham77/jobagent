from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from apply.db.models import Job, Profile, Story
from apply.services.draft_generator import DraftGenerator, _build_profile_context, _build_story_context


def _make_content(text: str):
    c = MagicMock()
    c.text = text
    return c


def _make_response(text: str):
    r = MagicMock()
    r.content = [_make_content(text)]
    return r


@pytest.fixture
def generator():
    with patch("apply.services.draft_generator.anthropic.AsyncAnthropic"):
        gen = DraftGenerator()
        gen._client = MagicMock()
        gen._client.messages = MagicMock()
        gen._client.messages.create = AsyncMock(
            return_value=_make_response("Mocked cover letter body.")
        )
        return gen


async def test_generate_cover_letter_calls_claude(
    generator: DraftGenerator, sample_job: Job, sample_profile: Profile
):
    result = await generator.generate_cover_letter(sample_job, sample_profile)
    assert result == "Mocked cover letter body."
    generator._client.messages.create.assert_called_once()
    call_kwargs = generator._client.messages.create.call_args.kwargs
    assert call_kwargs["system"] is not None
    assert "invent" in call_kwargs["system"].lower() or "fabricat" in call_kwargs["system"].lower()


async def test_generate_cover_letter_includes_job_details(
    generator: DraftGenerator, sample_job: Job, sample_profile: Profile
):
    await generator.generate_cover_letter(sample_job, sample_profile)
    user_msg = generator._client.messages.create.call_args.kwargs["messages"][0]["content"]
    assert "Linear" in user_msg
    assert "Senior Backend Engineer" in user_msg


async def test_generate_answers_returns_parsed_list(
    generator: DraftGenerator,
    sample_job: Job,
    sample_profile: Profile,
    sample_stories: list[Story],
):
    generator._client.messages.create = AsyncMock(
        return_value=_make_response(
            '[{"question": "Why this role?", "answer": "Because it is a great opportunity."}]'
        )
    )
    results = await generator.generate_answers(
        sample_job, sample_profile, sample_stories, ["Why this role?"]
    )
    assert len(results) == 1
    assert results[0]["question"] == "Why this role?"
    assert len(results[0]["answer"]) > 0


async def test_generate_answers_handles_bad_json(
    generator: DraftGenerator,
    sample_job: Job,
    sample_profile: Profile,
    sample_stories: list[Story],
):
    generator._client.messages.create = AsyncMock(
        return_value=_make_response("not json at all")
    )
    results = await generator.generate_answers(
        sample_job, sample_profile, sample_stories, ["Why this role?"]
    )
    # Should not raise; falls back to single-answer format
    assert len(results) == 1


async def test_generate_answers_empty_questions(
    generator: DraftGenerator, sample_job: Job, sample_profile: Profile
):
    results = await generator.generate_answers(sample_job, sample_profile, [], [])
    assert results == []
    generator._client.messages.create.assert_not_called()


def test_build_profile_context_includes_skills(sample_profile: Profile):
    ctx = _build_profile_context(sample_profile)
    assert "Java" in ctx
    assert "Spring Boot" in ctx


def test_build_story_context_includes_themes(sample_stories: list[Story]):
    ctx = _build_story_context(sample_stories)
    assert "leadership" in ctx
    assert "Microservices Migration" in ctx
