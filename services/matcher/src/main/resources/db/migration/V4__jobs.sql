CREATE TABLE jobs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id     TEXT        NOT NULL,
    source          TEXT        NOT NULL,
    title           TEXT        NOT NULL,
    company         TEXT        NOT NULL,
    location        TEXT,
    remote          BOOLEAN     NOT NULL DEFAULT true,
    salary_mode     TEXT        NOT NULL DEFAULT 'unstated',
    salary_min_usd  INT,
    salary_max_usd  INT,
    salary_raw      TEXT,
    jd_body         TEXT,
    apply_url       TEXT,
    tier            INT         NOT NULL DEFAULT 2,
    posted_at       TIMESTAMPTZ,
    discovered_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    embedding       vector(1536),
    UNIQUE(source, external_id)
);

CREATE TABLE job_fit_scores (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    profile_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    score           INT         NOT NULL,
    skill_overlap   INT,
    seniority_match INT,
    stack_overlap   INT,
    salary_fit      INT,
    breakdown       JSONB       NOT NULL DEFAULT '{}'::jsonb,
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(job_id, profile_id)
);
