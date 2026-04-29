CREATE TABLE user_preferences (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    target_title          TEXT,
    target_stack          JSONB       NOT NULL DEFAULT '[]'::jsonb,
    min_salary            INT,
    location              TEXT,
    auto_apply_threshold  INT         NOT NULL DEFAULT 80,
    usd_only              BOOLEAN     NOT NULL DEFAULT true,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
