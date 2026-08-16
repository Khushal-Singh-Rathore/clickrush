from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application Environment
    ENVIRONMENT: str = Field(
        default="development",
        description="Application environment (development, production, testing)",
    )

    # Cloudflare Turnstile CAPTCHA Secret Key
    TURNSTILE_SECRET_KEY: str = Field(
        default="",
        description="Cloudflare Turnstile secret key for server-side CAPTCHA verification",
    )

    # Database and Secret configuration (loaded from .env with local dev fallbacks)
    DATABASE_URL: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/clickrush",
        description="PostgreSQL connection string using psycopg driver",
    )
    JWT_SECRET_KEY: str = Field(
        default="development-only-secret-key-must-be-overridden-in-env",
        description="Secret key used to sign JWT access tokens",
    )

    # Public metadata configuration defaults
    JWT_ALGORITHM: str = Field(
        default="HS256",
        description="Algorithm used for signing JWT tokens",
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=60,
        description="Lifetime of access token in minutes",
    )
    CORS_ORIGINS: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"],
        description="Allowed origins for CORS policy",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
