CREATE TABLE applications (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id          UUID        NOT NULL REFERENCES jobs(id),
    profile_id      UUID        NOT NULL REFERENCES profiles(id),
    status          TEXT        NOT NULL DEFAULT 'discovered'
                                CHECK (status IN ('discovered','drafted','applied','active','closed')),
    closed_tag      TEXT        CHECK (closed_tag IN ('offer','rejected','withdrawn','ghosted')),
    cover_letter    TEXT,
    resume_variant  JSONB       NOT NULL DEFAULT '{}'::jsonb,
    submitted_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, job_id)
);

CREATE TABLE answers (
    id               UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id   UUID  NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    question         TEXT  NOT NULL,
    original_answer  TEXT  NOT NULL,
    edited_answer    TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status  ON applications(status);
