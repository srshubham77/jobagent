CREATE TABLE email_events (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL,
    message_id      TEXT         NOT NULL,
    thread_id       TEXT,
    sender          TEXT         NOT NULL,
    subject         TEXT,
    received_at     TIMESTAMPTZ  NOT NULL,
    classification  TEXT         NOT NULL
                    CHECK (classification IN ('ack','recruiter_contact','interview_scheduling','rejection','offer','irrelevant')),
    confidence      NUMERIC(4,3) NOT NULL,
    application_id  UUID         REFERENCES applications(id),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE(user_id, message_id)
);

CREATE INDEX idx_email_events_application   ON email_events(application_id);
CREATE INDEX idx_email_events_user_received ON email_events(user_id, received_at DESC);
