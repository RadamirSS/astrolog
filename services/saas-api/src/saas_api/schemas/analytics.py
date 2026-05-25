from pydantic import BaseModel, Field


class AnalyticsEventPayload(BaseModel):
    model_config = {"populate_by_name": True}

    event_name: str = Field(alias="eventName")
    tenant_id: str | None = Field(default=None, alias="tenantId")
    tenant_slug: str | None = Field(default=None, alias="tenantSlug")
    user_id: str | None = Field(default=None, alias="userId")
    session_id: str | None = Field(default=None, alias="sessionId")
    timestamp: str | None = None
    properties: dict | None = None


class TrackAnalyticsEventsRequest(BaseModel):
    events: list[AnalyticsEventPayload] = Field(min_length=1)


class TrackAnalyticsEventsResponse(BaseModel):
    accepted: bool = True
