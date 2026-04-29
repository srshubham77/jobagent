CREATE TABLE profiles (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    version_number INT         NOT NULL,
    is_current     BOOLEAN     NOT NULL DEFAULT false,
    contact        JSONB       NOT NULL DEFAULT '{}'::jsonb,
    summary        TEXT,
    experience     JSONB       NOT NULL DEFAULT '[]'::jsonb,
    education      JSONB       NOT NULL DEFAULT '[]'::jsonb,
    skills         JSONB       NOT NULL DEFAULT '[]'::jsonb,
    projects       JSONB       NOT NULL DEFAULT '[]'::jsonb,
    certifications JSONB       NOT NULL DEFAULT '[]'::jsonb,
    raw_text       TEXT,
    parse_source   TEXT        NOT NULL DEFAULT 'tika',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_profiles_user_current ON profiles(user_id) WHERE is_current = true;
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
