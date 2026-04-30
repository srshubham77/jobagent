ALTER TABLE user_preferences
    ADD COLUMN IF NOT EXISTS agent_enabled BOOLEAN NOT NULL DEFAULT true;
