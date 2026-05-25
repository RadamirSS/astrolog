import logging

DEFAULT_SESSION_SECRET = "dev-session-secret-change-in-production"


class ProductionSettingsError(RuntimeError):
    """Raised when production/staging settings violate deployment policy."""


def validate_saas_production_settings(
    *,
    app_env: str,
    database_url: str,
    saas_session_secret: str,
    allow_dev_telegram_auth: bool,
    telegram_bot_token: str,
    saas_cookie_secure: bool = False,
    cors_origins: list[str] | None = None,
    logger: logging.Logger | None = None,
) -> None:
    """Validate SaaS API settings for staging/production deployments."""
    env = (app_env or "development").lower()
    log = logger or logging.getLogger(__name__)
    origins = cors_origins or []

    if env not in {"staging", "production"}:
        return

    if allow_dev_telegram_auth:
        raise ProductionSettingsError(
            f"ALLOW_DEV_TELEGRAM_AUTH must be false when APP_ENV={env}"
        )

    if not (database_url or "").strip():
        raise ProductionSettingsError(f"DATABASE_URL is required when APP_ENV={env}")

    secret = (saas_session_secret or "").strip()
    if not secret or secret == DEFAULT_SESSION_SECRET:
        raise ProductionSettingsError(
            f"SAAS_SESSION_SECRET must be set to a strong unique value when APP_ENV={env}"
        )

    if env == "production" and not saas_cookie_secure:
        raise ProductionSettingsError(
            "SAAS_COOKIE_SECURE must be true when APP_ENV=production"
        )

    if any(origin.strip() == "*" for origin in origins):
        raise ProductionSettingsError("CORS_ORIGINS must not include '*' in staging/production")

    token = (telegram_bot_token or "").strip()
    if env == "production" and not token:
        raise ProductionSettingsError(
            "TELEGRAM_BOT_TOKEN is required when APP_ENV=production"
        )

    if env == "staging" and not token:
        log.warning(
            "TELEGRAM_BOT_TOKEN is not set; Telegram initData validation will fail until configured"
        )


def validate_integration_settings(
    *,
    app_env: str,
    payment_api_mode: str,
    payment_api_base_url: str,
    payment_api_token: str,
    astro_api_mode: str,
    astro_api_base_url: str,
    astro_api_token: str,
    allow_staging_mocks: bool = False,
    logger: logging.Logger | None = None,
) -> None:
    """Validate payment/astro integration modes for staging/production."""
    env = (app_env or "development").lower()
    log = logger or logging.getLogger(__name__)
    payment_mode = (payment_api_mode or "mock").lower()
    astro_mode = (astro_api_mode or "mock").lower()

    if env == "development":
        log.info(
            "Integration modes: PAYMENT_API_MODE=%s ASTRO_API_MODE=%s (development)",
            payment_mode,
            astro_mode,
        )
        return

    if env not in {"staging", "production"}:
        return

    if env == "production" and payment_mode == "mock":
        raise ProductionSettingsError(
            "PAYMENT_API_MODE=mock is forbidden when APP_ENV=production"
        )

    if env == "production" and astro_mode == "mock":
        raise ProductionSettingsError(
            "ASTRO_API_MODE=mock is forbidden when APP_ENV=production"
        )

    if payment_mode == "remote":
        if not (payment_api_base_url or "").strip():
            raise ProductionSettingsError(
                f"PAYMENT_API_BASE_URL is required when PAYMENT_API_MODE=remote and APP_ENV={env}"
            )
    elif env == "staging" and not allow_staging_mocks:
        raise ProductionSettingsError(
            "PAYMENT_API_MODE=mock in staging requires ALLOW_STAGING_MOCKS=true"
        )

    if astro_mode == "remote":
        if not (astro_api_base_url or "").strip():
            raise ProductionSettingsError(
                f"ASTRO_API_BASE_URL is required when ASTRO_API_MODE=remote and APP_ENV={env}"
            )
    elif env == "staging" and not allow_staging_mocks:
        raise ProductionSettingsError(
            "ASTRO_API_MODE=mock in staging requires ALLOW_STAGING_MOCKS=true"
        )

    if payment_mode == "remote" and env == "production" and not (payment_api_token or "").strip():
        raise ProductionSettingsError(
            "PAYMENT_API_TOKEN is required when PAYMENT_API_MODE=remote and APP_ENV=production"
        )

    if astro_mode == "remote" and env == "production" and not (astro_api_token or "").strip():
        raise ProductionSettingsError(
            "ASTRO_API_TOKEN is required when ASTRO_API_MODE=remote and APP_ENV=production"
        )

    log.info(
        "Integration modes: PAYMENT_API_MODE=%s ASTRO_API_MODE=%s APP_ENV=%s",
        payment_mode,
        astro_mode,
        env,
    )
