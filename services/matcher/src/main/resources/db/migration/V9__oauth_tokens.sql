CREATE TABLE oauth_tokens (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL,
    provider            TEXT        NOT NULL,
    access_token_enc    BYTEA       NOT NULL,
    refresh_token_enc   BYTEA       NOT NULL,
    expires_at          TIMESTAMPTZ,
    scope               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, provider)
);
