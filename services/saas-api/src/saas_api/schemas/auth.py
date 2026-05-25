from datetime import UTC, datetime

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=1)


class AccountSummary(BaseModel):
    id: str
    email: str
    role: str
    partner_id: str | None = Field(default=None, alias="partnerId")


class LoginResponse(BaseModel):
    account: AccountSummary


class CreateTenantRequest(BaseModel):
    model_config = {"populate_by_name": True}

    slug: str = Field(min_length=2)
    display_name: str = Field(alias="displayName", min_length=1)
    preset: str
    owner_email: str | None = Field(default=None, alias="ownerEmail")


class UpdateTenantStatusRequest(BaseModel):
    status: str
