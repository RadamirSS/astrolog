from pydantic import BaseModel, Field


class TenantHealthResponse(BaseModel):
    model_config = {"populate_by_name": True}

    tenant_id: str = Field(alias="tenantId")
    slug: str
    status: str
    has_published_config: bool = Field(alias="hasPublishedConfig")
    has_draft_config: bool = Field(alias="hasDraftConfig")
    active_product_count: int = Field(alias="activeProductCount")
    enabled_modules_count: int = Field(alias="enabledModulesCount")
    recent_analytics_count: int = Field(alias="recentAnalyticsCount")
    recent_report_failures: int = Field(alias="recentReportFailures")
    last_report_generated_at: str | None = Field(default=None, alias="lastReportGeneratedAt")
    last_published_at: str | None = Field(default=None, alias="lastPublishedAt")
    integration_statuses: dict[str, str] = Field(alias="integrationStatuses")
    media_asset_counts: dict[str, int] = Field(alias="mediaAssetCounts")
    warnings: list[str]


class AuditLogItemResponse(BaseModel):
    model_config = {"populate_by_name": True}

    id: str
    actor_account_id: str | None = Field(default=None, alias="actorAccountId")
    tenant_id: str | None = Field(default=None, alias="tenantId")
    action: str
    payload: dict | None = None
    created_at: str = Field(alias="createdAt")
