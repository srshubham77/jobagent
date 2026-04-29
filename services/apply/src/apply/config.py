from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://jobagent:jobagent@localhost:5432/jobagent"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-6"
    anthropic_max_tokens: int = 4096

    # Kill switch — when False, submission is blocked at the service layer
    agent_enabled: bool = True

    # Playwright submission settings
    playwright_headless: bool = True
    playwright_timeout_ms: int = 30_000

    port: int = 8084


settings = Settings()
