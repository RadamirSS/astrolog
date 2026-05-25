from pydantic import BaseModel, ConfigDict, Field


class CheckoutBirthInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    birth_date: str = Field(alias="birthDate")
    birth_time: str | None = Field(default=None, alias="birthTime")
    time_accuracy: str = Field(default="unknown", alias="timeAccuracy")
    birth_place: str = Field(alias="birthPlace")


class CheckoutPartnerInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    partner_id: str | None = Field(default=None, alias="partnerId")
    partner_slug: str | None = Field(default=None, alias="partnerSlug")
    campaign_id: str | None = Field(default=None, alias="campaignId")


class StartCheckoutRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    tenant_id: str = Field(alias="tenantId")
    tenant_slug: str = Field(alias="tenantSlug")
    product_id: str = Field(alias="productId")
    product_type: str = Field(alias="productType")
    theme: str | None = None
    locale: str | None = None
    birth: CheckoutBirthInput | None = None
    partner: CheckoutPartnerInput | None = None


class ConfirmPaymentReturnRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    order_id: str = Field(alias="orderId")
    return_state: str = Field(alias="returnState")
