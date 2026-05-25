from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class BirthProfileInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    birth_date: str = Field(alias="birthDate")
    birth_time: str | None = Field(default=None, alias="birthTime")
    birth_city: str | None = Field(default=None, alias="birthCity")
    birth_place: str | None = Field(default=None, alias="birthPlace")
    topic: str | None = None

    @model_validator(mode="after")
    def normalize_birth_place(self) -> "BirthProfileInput":
        if not self.birth_city and not self.birth_place:
            raise ValueError("birthCity or birthPlace is required")
        if not self.birth_city and self.birth_place:
            self.birth_city = self.birth_place
        return self


class StyleProfileInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    tone: str
    brand_voice: str = Field(alias="brandVoice")


class FreeReportRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    tenant_id: str = Field(alias="tenantId")
    tenant_slug: str = Field(alias="tenantSlug")
    locale: str = "en"
    report_type: str = Field(alias="reportType")
    birth_profile: BirthProfileInput = Field(alias="birthProfile")
    style_profile: StyleProfileInput = Field(alias="styleProfile")


class ReportHighlight(BaseModel):
    id: str
    label: str | None = None
    value: str | None = None
    title: str | None = None
    text: str | None = None
    icon: str | None = None


class ReportSection(BaseModel):
    id: str
    title: str
    content: str
    order: int
    variant: Literal["default", "quote", "highlight"] | None = None
    access: Literal["free", "locked", "paid"] | None = None
    icon: str | None = None


class LockedSection(BaseModel):
    id: str
    title: str
    teaser: str
    unlock_product_id: str | None = Field(default=None, alias="unlockProductId")


class ReportCta(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    label: str
    title: str | None = None
    subtitle: str | None = None
    button_label: str | None = Field(default=None, alias="buttonLabel")
    target: str | None = None
    product_id: str | None = Field(default=None, alias="productId")
    action: Literal["navigate_products", "external_url"]
    url: str | None = None


class Report(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    type: Literal["free", "natal", "compatibility", "forecast", "custom"]
    title: str
    subtitle: str | None = None
    summary: str
    highlights: list[ReportHighlight]
    sections: list[ReportSection]
    locked_sections: list[LockedSection] = Field(default_factory=list, alias="lockedSections")
    cta: ReportCta | None = None
    recommended_products: list[str] = Field(default_factory=list, alias="recommendedProducts")
    generated_at: str = Field(alias="generatedAt")
