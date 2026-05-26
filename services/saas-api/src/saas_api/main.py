from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend_common.handlers import register_exception_handlers
from backend_common.logging import setup_logging
from backend_common.middleware import RequestIdMiddleware
from backend_common.production_checks import (
    ProductionSettingsError,
    validate_integration_settings,
    validate_saas_production_settings,
)
from saas_api.api.routes_admin import router as admin_router
from saas_api.api.routes_analytics import router as analytics_router
from saas_api.api.routes_auth import router as auth_router
from saas_api.api.routes_checkout import entitlements_router, router as checkout_router
from saas_api.api.routes_premium_requests import dashboard_router as premium_dashboard_router
from saas_api.api.routes_premium_requests import router as premium_requests_router
from saas_api.api.routes_creator import router as creator_router
from saas_api.api.routes_dashboard import router as dashboard_router
from saas_api.api.routes_public_surfaces import router as public_surfaces_router
from saas_api.api.routes_dashboard_ops import router as dashboard_ops_router
from saas_api.api.routes_health import router as health_router
from saas_api.api.routes_me import router as me_router
from saas_api.api.routes_public_partners import miniapps_router as public_miniapps_router
from saas_api.api.routes_public_partners import router as public_partners_router
from saas_api.api.routes_public_tenant import router as public_tenant_router
from saas_api.api.routes_reports import router as reports_router
from saas_api.api.routes_telegram import router as telegram_router
from saas_api.settings import settings

logger = setup_logging(settings.service_name)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        validate_saas_production_settings(
            app_env=settings.app_env,
            database_url=settings.database_url,
            saas_session_secret=settings.saas_session_secret,
            allow_dev_telegram_auth=settings.allow_dev_telegram_auth,
            telegram_bot_token=settings.telegram_bot_token,
            saas_cookie_secure=settings.saas_cookie_secure,
            cors_origins=settings.cors_origins,
            logger=logger,
        )
        validate_integration_settings(
            app_env=settings.app_env,
            payment_api_mode=settings.payment_api_mode,
            payment_api_base_url=settings.payment_api_base_url,
            payment_api_token=settings.payment_api_token,
            astro_api_mode=settings.astro_api_mode,
            astro_api_base_url=settings.astro_api_base_url,
            astro_api_token=settings.astro_api_token,
            allow_staging_mocks=settings.allow_staging_mocks,
            logger=logger,
        )
    except ProductionSettingsError as exc:
        logger.error("Production settings validation failed: %s", exc)
        raise
    logger.info(
        "Starting %s v%s (%s) on port %s",
        settings.service_name,
        settings.app_version,
        settings.app_env,
        settings.saas_api_port,
    )
    yield
    logger.info("Shutting down %s", settings.service_name)


def create_app() -> FastAPI:
    app = FastAPI(
        title="Astro SaaS API",
        version=settings.app_version,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestIdMiddleware)

    register_exception_handlers(app, logger)
    app.include_router(health_router)
    app.include_router(auth_router)
    app.include_router(dashboard_router)
    app.include_router(creator_router)
    app.include_router(dashboard_ops_router)
    app.include_router(analytics_router)
    app.include_router(admin_router)
    app.include_router(public_tenant_router)
    app.include_router(public_partners_router)
    app.include_router(public_miniapps_router)
    app.include_router(public_surfaces_router)
    app.include_router(telegram_router)
    app.include_router(me_router)
    app.include_router(reports_router)
    app.include_router(checkout_router)
    app.include_router(entitlements_router)
    app.include_router(premium_requests_router)
    app.include_router(premium_dashboard_router)

    if settings.media_storage_provider.lower() == "local":
        media_root = Path(settings.media_local_root)
        if not media_root.is_absolute():
            media_root = Path(__file__).resolve().parents[2] / media_root
        media_root.mkdir(parents=True, exist_ok=True)
        app.mount("/media", StaticFiles(directory=str(media_root)), name="media")

    return app


app = create_app()
