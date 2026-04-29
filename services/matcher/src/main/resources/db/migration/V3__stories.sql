CREATE TABLE stories (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT        NOT NULL,
    situation  TEXT        NOT NULL,
    action     TEXT        NOT NULL,
    result     TEXT        NOT NULL,
    metrics    TEXT,
    themes     JSONB       NOT NULL DEFAULT '[]'::jsonb,
    variants   JSONB       NOT NULL DEFAULT '{}'::jsonb,
    source_ref TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_themes   ON stories USING GIN(themes);
