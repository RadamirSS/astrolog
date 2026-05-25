import json
import re
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator, model_validator

from backend_common.errors import ApiErrorCode, AppError

SLUG_RE = re.compile(r"^[a-z0-9-]+$")
HEX_COLOR_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")

THEME_PRESETS = {
    "mystic-dark",
    "soft-feminine",
    "cosmic-violet",
    "luxury-gold",
    "minimal-white",
    "pink-moon",
}


class BrandModel(BaseModel):
    model_config = ConfigDict(extra="allow", populate_by_name=True)

    display_name: str = Field(alias="displayName", min_length=1)


class ThemeModel(BaseModel):
    model_config = ConfigDict(extra="allow", populate_by_name=True)

    preset: str

    @field_validator("preset")
    @classmethod
    def validate_preset(cls, v: str) -> str:
        if v not in THEME_PRESETS:
            raise ValueError(f"Invalid theme preset: {v}")
        return v


class HomeContentModel(BaseModel):
    model_config = ConfigDict(extra="allow", populate_by_name=True)

    headline: str = Field(min_length=1)
    cta_label: str = Field(alias="ctaLabel", min_length=1)


class ContentModel(BaseModel):
    model_config = ConfigDict(extra="allow", populate_by_name=True)

    home: HomeContentModel


class ModulesModel(BaseModel):
    model_config = ConfigDict(extra="allow", populate_by_name=True)

    onboarding: bool
    free_report: bool = Field(alias="freeReport")
    products: bool
    profile: bool


class ProductModel(BaseModel):
    model_config = ConfigDict(extra="allow", populate_by_name=True)

    id: str = Field(min_length=1)
    slug: str = Field(min_length=1)
    type: str
    title: str
    cta_label: str = Field(alias="ctaLabel")
    featured: bool
    sort_order: int = Field(alias="sortOrder")
    status: str

    @model_validator(mode="after")
    def validate_active_product(self) -> "ProductModel":
        if self.status == "active":
            if not self.title.strip():
                raise ValueError("Active products require a title")
            if not self.cta_label.strip():
                raise ValueError("Active products require a ctaLabel")
        return self


class TenantConfigModel(BaseModel):
    model_config = ConfigDict(extra="allow", populate_by_name=True)

    tenant_id: str = Field(alias="tenantId", min_length=1)
    slug: str = Field(min_length=2)
    status: str
    brand: BrandModel
    theme: ThemeModel
    content: ContentModel
    modules: ModulesModel
    products: list[ProductModel] = Field(default_factory=list)
    version: int = 1

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        if not SLUG_RE.match(v):
            raise ValueError("Slug must be lowercase alphanumeric with hyphens")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in {"draft", "active", "paused"}:
            raise ValueError("Status must be draft, active, or paused")
        return v

    @model_validator(mode="after")
    def validate_unique_product_ids(self) -> "TenantConfigModel":
        ids = [p.id for p in self.products]
        if len(ids) != len(set(ids)):
            raise ValueError("Product IDs must be unique")
        return self


def _validation_field_errors(exc: ValidationError) -> dict[str, list[str]]:
    field_errors: dict[str, list[str]] = {}
    for error in exc.errors():
        loc = [str(part) for part in error.get("loc", [])]
        key = ".".join(loc) if loc else "config"
        field_errors.setdefault(key, []).append(error.get("msg", "Invalid value"))
    return field_errors


def validate_tenant_config(config: dict[str, Any], *, expected_tenant_id: str | None = None) -> dict[str, Any]:
    try:
        validated = TenantConfigModel.model_validate(config)
    except ValidationError as exc:
        raise AppError(
            ApiErrorCode.CONFIG_INVALID,
            "Tenant config validation failed",
            field_errors=_validation_field_errors(exc),
            status_code=400,
        ) from exc

    if expected_tenant_id and validated.tenant_id != expected_tenant_id:
        raise AppError(
            ApiErrorCode.CONFIG_INVALID,
            "tenantId does not match tenant",
            field_errors={"tenantId": ["Must match the tenant being edited"]},
            status_code=400,
        )

    _validate_color_overrides(config)
    return config


def _validate_color_overrides(config: dict[str, Any]) -> None:
    overrides = config.get("theme", {}).get("overrides") or {}
    for key in ("primaryColor", "accentColor"):
        value = overrides.get(key)
        if value and not HEX_COLOR_RE.match(value):
            raise AppError(
                ApiErrorCode.CONFIG_INVALID,
                f"Invalid color for {key}",
                field_errors={f"theme.overrides.{key}": ["Must be a 6-digit hex color"]},
                status_code=400,
            )


def json_equal(a: Any, b: Any) -> bool:
    return json.dumps(a, sort_keys=True) == json.dumps(b, sort_keys=True)
