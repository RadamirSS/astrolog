from pydantic import Field
from pydantic_settings import SettingsConfigDict

from backend_common.settings import BaseServiceSettings


class Settings(BaseServiceSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    service_name: str = Field(default="saas-api", alias="SERVICE_NAME")
    saas_api_port: int = Field(default=8000, alias="SAAS_API_PORT")

    database_url: str = Field(
        default="postgresql+psycopg://astro:astro@localhost:5432/astro_saas",
        alias="DATABASE_URL",
    )
    saas_session_secret: str = Field(
        default="dev-session-secret-change-in-production",
        alias="SAAS_SESSION_SECRET",
    )
    saas_cookie_name: str = Field(default="saas_session", alias="SAAS_COOKIE_NAME")
    saas_cookie_secure: bool = Field(default=False, alias="SAAS_COOKIE_SECURE")
    saas_cookie_samesite: str = Field(default="lax", alias="SAAS_COOKIE_SAMESITE")
    saas_cookie_domain: str | None = Field(default=None, alias="SAAS_COOKIE_DOMAIN")
    saas_session_ttl_hours: int = Field(default=168, alias="SAAS_SESSION_TTL_HOURS")

    saas_bootstrap_admin_email: str = Field(
        default="admin@astro.local", alias="SAAS_BOOTSTRAP_ADMIN_EMAIL"
    )
    saas_bootstrap_admin_password: str = Field(
        default="admin123!", alias="SAAS_BOOTSTRAP_ADMIN_PASSWORD"
    )
    saas_bootstrap_blogger_email: str = Field(
        default="blogger@astro.local", alias="SAAS_BOOTSTRAP_BLOGGER_EMAIL"
    )
    saas_bootstrap_blogger_password: str = Field(
        default="blogger123!", alias="SAAS_BOOTSTRAP_BLOGGER_PASSWORD"
    )

    telegram_bot_token: str = Field(default="", alias="TELEGRAM_BOT_TOKEN")
    allow_dev_telegram_auth: bool = Field(default=False, alias="ALLOW_DEV_TELEGRAM_AUTH")
    telegram_bot_setup_mode: str = Field(default="mock", alias="TELEGRAM_BOT_SETUP_MODE")
    telegram_token_encryption_key: str = Field(default="", alias="TELEGRAM_TOKEN_ENCRYPTION_KEY")
    astro_api_base_url: str = Field(default="http://localhost:8100", alias="ASTRO_API_BASE_URL")
    astro_api_timeout_seconds: int = Field(default=20, alias="ASTRO_API_TIMEOUT_SECONDS")
    astro_api_mode: str = Field(default="mock", alias="ASTRO_API_MODE")
    astro_api_token: str = Field(default="", alias="ASTRO_API_TOKEN")
    astro_api_timeout_ms: int = Field(default=30000, alias="ASTRO_API_TIMEOUT_MS")
    payment_api_mode: str = Field(default="mock", alias="PAYMENT_API_MODE")
    payment_api_base_url: str = Field(default="", alias="PAYMENT_API_BASE_URL")
    payment_api_token: str = Field(default="", alias="PAYMENT_API_TOKEN")
    payment_api_timeout_ms: int = Field(default=30000, alias="PAYMENT_API_TIMEOUT_MS")
    allow_staging_mocks: bool = Field(default=False, alias="ALLOW_STAGING_MOCKS")
    miniapp_public_base_url: str = Field(
        default="http://localhost:3000", alias="MINIAPP_PUBLIC_BASE_URL"
    )
    end_user_cookie_name: str = Field(default="saas_end_user_session", alias="END_USER_COOKIE_NAME")
    end_user_session_ttl_hours: int = Field(default=168, alias="END_USER_SESSION_TTL_HOURS")

    media_storage_provider: str = Field(default="local", alias="MEDIA_STORAGE_PROVIDER")
    media_local_root: str = Field(default="var/media", alias="MEDIA_LOCAL_ROOT")
    media_public_base_url: str = Field(
        default="http://localhost:8000/media", alias="MEDIA_PUBLIC_BASE_URL"
    )
    media_max_upload_mb: int = Field(default=5, alias="MEDIA_MAX_UPLOAD_MB")

    commission_hold_days: int = Field(default=7, alias="COMMISSION_HOLD_DAYS")
    platform_default_commission_rate: float = Field(
        default=0.5, alias="PLATFORM_DEFAULT_COMMISSION_RATE"
    )


settings = Settings()
