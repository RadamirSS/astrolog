from pydantic import BaseModel, Field


class MetricsConversion(BaseModel):
    model_config = {"populate_by_name": True}

    visit_to_profile: float = Field(alias="visitToProfile")
    profile_to_report: float = Field(alias="profileToReport")
    report_to_product_click: float = Field(alias="reportToProductClick")


class DashboardMetricsResponse(BaseModel):
    model_config = {"populate_by_name": True}

    period: str
    visits: int
    onboarding_starts: int = Field(alias="onboardingStarts")
    birth_profiles_submitted: int = Field(alias="birthProfilesSubmitted")
    free_reports_requested: int = Field(alias="freeReportsRequested")
    free_reports_viewed: int = Field(alias="freeReportsViewed")
    product_clicks: int = Field(alias="productClicks")
    product_cta_clicks: int = Field(alias="productCtaClicks")
    reports_generated: int = Field(alias="reportsGenerated")
    report_failures: int = Field(alias="reportFailures")
    conversion: MetricsConversion
