from saas_api.auth.passwords import new_id
from saas_api.db.models.integration_status import (
    IntegrationModule,
    IntegrationModuleStatus,
    IntegrationStatus,
)
from saas_api.settings import settings

MODULE_API_KEYS = {
    IntegrationModule.TELEGRAM: "telegram",
    IntegrationModule.PAYMENTS: "payments",
    IntegrationModule.ANALYTICS: "analytics",
    IntegrationModule.BACKEND_API: "backendApi",
    IntegrationModule.REPORT_GENERATION: "reportGeneration",
}

DEFAULT_STATUSES: dict[str, str] = {
    IntegrationModule.TELEGRAM: IntegrationModuleStatus.NOT_CONFIGURED,
    IntegrationModule.PAYMENTS: IntegrationModuleStatus.COMING_LATER,
    IntegrationModule.ANALYTICS: IntegrationModuleStatus.NOT_CONFIGURED,
    IntegrationModule.BACKEND_API: IntegrationModuleStatus.MOCK_ONLY,
    IntegrationModule.REPORT_GENERATION: IntegrationModuleStatus.MOCK_ONLY,
}


def ensure_default_integration_statuses(db, tenant_id: str) -> None:
    for module, status in DEFAULT_STATUSES.items():
        existing = (
            db.query(IntegrationStatus)
            .filter(IntegrationStatus.tenant_id == tenant_id, IntegrationStatus.module == module)
            .first()
        )
        if existing:
            continue
        db.add(
            IntegrationStatus(
                id=new_id("int"),
                tenant_id=tenant_id,
                module=module,
                status=status,
            )
        )


def get_integration_statuses_dict(db, tenant_id: str) -> dict[str, str]:
    ensure_default_integration_statuses(db, tenant_id)
    rows = db.query(IntegrationStatus).filter(IntegrationStatus.tenant_id == tenant_id).all()
    result = {
        MODULE_API_KEYS[module]: status.value if hasattr(status, "value") else status
        for module, status in DEFAULT_STATUSES.items()
    }
    for row in rows:
        api_key = MODULE_API_KEYS.get(row.module)
        if api_key:
            result[api_key] = row.status

    result["analytics"] = IntegrationModuleStatus.ACTIVE
    result["backendApi"] = IntegrationModuleStatus.ACTIVE
    if settings.astro_api_base_url:
        result["reportGeneration"] = IntegrationModuleStatus.ACTIVE
    if settings.telegram_bot_token:
        result["telegram"] = IntegrationModuleStatus.ACTIVE
    result["payments"] = IntegrationModuleStatus.COMING_LATER
    return result
