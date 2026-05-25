from pydantic import BaseModel, Field


class MediaAssetResponse(BaseModel):
    model_config = {"populate_by_name": True}

    id: str
    tenant_id: str = Field(alias="tenantId")
    kind: str
    public_url: str = Field(alias="publicUrl")
    original_filename: str = Field(alias="originalFilename")
    mime_type: str = Field(alias="mimeType")
    size_bytes: int = Field(alias="sizeBytes")
    width: int | None = None
    height: int | None = None
    status: str
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")


class MediaDeleteResponse(BaseModel):
    deleted: bool
    id: str
