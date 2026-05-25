from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend_common.handlers import register_exception_handlers
from backend_common.logging import setup_logging
from backend_common.middleware import RequestIdMiddleware
from astro_api.api.routes_health import router as health_router
from astro_api.api.routes_reports import router as reports_router
from astro_api.settings import settings

logger = setup_logging(settings.service_name)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "Starting %s v%s (%s) on port %s",
        settings.service_name,
        settings.app_version,
        settings.app_env,
        settings.astro_api_port,
    )
    yield
    logger.info("Shutting down %s", settings.service_name)


def create_app() -> FastAPI:
    app = FastAPI(
        title="Astro Report API",
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
    app.include_router(reports_router)

    return app


app = create_app()
