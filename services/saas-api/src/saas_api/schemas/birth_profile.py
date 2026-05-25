from pydantic import BaseModel, ConfigDict, Field, model_validator

ACTIVE_TOPICS = frozenset({"money", "relationships", "personality"})
LEGACY_TOPICS = frozenset(
    {
        "relationships",
        "purpose",
        "money",
        "career",
        "family",
        "personal-path",
        "compatibility",
    }
)


def normalize_locale(locale: str | None) -> str:
    if not locale:
        return "en"
    normalized = locale.lower().strip()
    return normalized if normalized in ("en", "ru") else "en"


class BirthProfileInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    birth_date: str = Field(alias="birthDate")
    birth_time: str | None = Field(default=None, alias="birthTime")
    birth_city: str | None = Field(default=None, alias="birthCity")
    birth_place: str | None = Field(default=None, alias="birthPlace")
    topic: str
    locale: str = "en"

    @model_validator(mode="after")
    def validate_birth_place(self) -> "BirthProfileInput":
        if not self.birth_city and not self.birth_place:
            raise ValueError("birthCity or birthPlace is required")
        if not self.birth_city and self.birth_place:
            self.birth_city = self.birth_place
        return self

    @model_validator(mode="after")
    def validate_topic(self) -> "BirthProfileInput":
        if self.topic not in ACTIVE_TOPICS:
            if self.topic in LEGACY_TOPICS:
                raise ValueError(
                    f"Topic '{self.topic}' is deprecated. Use one of: money, relationships, personality"
                )
            raise ValueError(f"Unsupported topic: {self.topic}")
        return self


class BirthProfileResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    user_id: str = Field(alias="userId")
    tenant_id: str = Field(alias="tenantId")
    name: str
    birth_date: str = Field(alias="birthDate")
    birth_time: str | None = Field(default=None, alias="birthTime")
    birth_place: str = Field(alias="birthPlace")
    topic: str
    locale: str
    created_at: str = Field(alias="createdAt")
    updated_at: str | None = Field(default=None, alias="updatedAt")
