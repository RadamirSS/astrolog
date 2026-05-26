from pydantic import BaseModel, Field


class ConnectTelegramBotRequest(BaseModel):
    token: str = Field(min_length=10)


class DisconnectTelegramBotRequest(BaseModel):
    integration_id: str | None = Field(default=None, alias="integrationId")

    model_config = {"populate_by_name": True}


class ValidateTelegramBotRequest(BaseModel):
    token: str = Field(min_length=10)


class SetSurfaceEnabledRequest(BaseModel):
    enabled: bool
