from pydantic import BaseModel, ConfigDict, Field


class EndUserSummary(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    tenant_id: str = Field(alias="tenantId")
    telegram_id: str = Field(alias="telegramId")
    telegram_username: str | None = Field(default=None, alias="telegramUsername")
    first_name: str | None = Field(default=None, alias="firstName")
    last_name: str | None = Field(default=None, alias="lastName")
    language_code: str | None = Field(default=None, alias="languageCode")


class ValidateInitDataRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    tenant_slug: str = Field(alias="tenantSlug")
    init_data: str = Field(alias="initData")


class ValidateInitDataResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user: EndUserSummary
