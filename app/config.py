from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = Field(
        default="postgresql+psycopg://khushalsinghrathore@localhost:5432/clickrush",
        description="PostgreSQL connection string using psycopg driver",
    )
    JWT_SECRET_KEY: str = Field(
        default="clickrush-super-secret-key-for-jwt-signing-minimum-32-chars",
        description="Secret key used to sign JWT access tokens",
    )
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
