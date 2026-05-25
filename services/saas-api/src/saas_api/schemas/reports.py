from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from saas_api.schemas.birth_profile import BirthProfileInput


class FreeReportRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    tenant_slug: str = Field(alias="tenantSlug")
    birth_profile: BirthProfileInput = Field(alias="birthProfile")
    locale: str = "en"


class ReportListItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    type: str
    title: str
    generated_at: str = Field(alias="generatedAt")


class ReportStatusResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    status: str
    report_type: str = Field(alias="reportType")
    locale: str
    error_code: str | None = Field(default=None, alias="errorCode")
    error_message: str | None = Field(default=None, alias="errorMessage")
    created_at: str = Field(alias="createdAt")
    completed_at: str | None = Field(default=None, alias="completedAt")
    report: dict[str, Any] | None = None
