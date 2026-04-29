CREATE TABLE funnel_events (
    id             BIGSERIAL   PRIMARY KEY,
    application_id UUID        NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    from_status    TEXT,
    to_status      TEXT        NOT NULL,
    source         TEXT        NOT NULL DEFAULT 'system',
    occurred_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_funnel_events_application_id ON funnel_events(application_id);
CREATE INDEX idx_funnel_events_occurred_at    ON funnel_events(occurred_at);
