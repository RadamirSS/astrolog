import mimetypes
import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Protocol

from backend_common.errors import ApiErrorCode, AppError
from saas_api.auth.passwords import new_id
from saas_api.db.models.account import Account
from saas_api.db.models.media_asset import MediaAsset, MediaAssetStatus, MediaKind, MediaStorageProvider
from saas_api.db.models.tenant import Tenant
from saas_api.settings import settings

ALLOWED_MIME_TYPES = frozenset({"image/jpeg", "image/png", "image/webp"})
MIME_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


class MediaStorageBackend(Protocol):
    def save(self, tenant_id: str, asset_id: str, content: bytes, mime_type: str) -> str: ...

    def delete(self, storage_key: str) -> None: ...


class LocalMediaStorage:
    def __init__(self, root: str, public_base_url: str) -> None:
        self.root = Path(root)
        self.public_base_url = public_base_url.rstrip("/")

    def _tenant_dir(self, tenant_id: str) -> Path:
        path = self.root / tenant_id
        path.mkdir(parents=True, exist_ok=True)
        return path

    def save(self, tenant_id: str, asset_id: str, content: bytes, mime_type: str) -> str:
        ext = MIME_EXTENSIONS.get(mime_type, mimetypes.guess_extension(mime_type) or ".bin")
        filename = f"{asset_id}{ext}"
        tenant_dir = self._tenant_dir(tenant_id)
        file_path = tenant_dir / filename
        file_path.write_bytes(content)
        return f"{tenant_id}/{filename}"

    def delete(self, storage_key: str) -> None:
        file_path = self.root / storage_key
        if file_path.is_file():
            file_path.unlink()


def get_storage_backend() -> MediaStorageBackend:
    provider = settings.media_storage_provider.lower()
    if provider == "local":
        root = settings.media_local_root
        if not os.path.isabs(root):
            root = str(Path(__file__).resolve().parents[3] / root)
        return LocalMediaStorage(root, settings.media_public_base_url)
    raise AppError(
        ApiErrorCode.INTERNAL_ERROR,
        f"Unsupported media storage provider: {provider}",
        status_code=500,
    )


def _public_url(storage_key: str) -> str:
    return f"{settings.media_public_base_url.rstrip('/')}/{storage_key}"


def _max_upload_bytes() -> int:
    return settings.media_max_upload_mb * 1024 * 1024


def _get_tenant_or_404(db, tenant_id: str) -> Tenant:
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise AppError(ApiErrorCode.NOT_FOUND, "Tenant not found", status_code=404)
    return tenant


def _validate_kind(kind: str) -> str:
    allowed = {item.value for item in MediaKind}
    if kind not in allowed:
        raise AppError(
            ApiErrorCode.VALIDATION_ERROR,
            f"Invalid media kind. Allowed: {', '.join(sorted(allowed))}",
            status_code=422,
        )
    return kind


def _validate_mime(content_type: str | None) -> str:
    if not content_type:
        raise AppError(ApiErrorCode.VALIDATION_ERROR, "Missing content type", status_code=422)
    mime = content_type.split(";")[0].strip().lower()
    if mime not in ALLOWED_MIME_TYPES:
        raise AppError(
            ApiErrorCode.VALIDATION_ERROR,
            "Unsupported file type. Allowed: JPEG, PNG, WebP",
            status_code=422,
        )
    return mime


def upload_media(
    db,
    *,
    tenant_id: str,
    kind: str,
    filename: str,
    content_type: str | None,
    content: bytes,
    account: Account | None = None,
) -> dict:
    _get_tenant_or_404(db, tenant_id)
    validated_kind = _validate_kind(kind)
    if not content:
        raise AppError(ApiErrorCode.VALIDATION_ERROR, "Empty file", status_code=422)
    if len(content) > _max_upload_bytes():
        raise AppError(
            ApiErrorCode.VALIDATION_ERROR,
            f"File exceeds maximum size of {settings.media_max_upload_mb}MB",
            status_code=422,
        )

    mime_type = _validate_mime(content_type)
    asset_id = new_id("media")
    storage = get_storage_backend()
    storage_key = storage.save(tenant_id, asset_id, content, mime_type)
    public_url = _public_url(storage_key)

    asset = MediaAsset(
        id=asset_id,
        tenant_id=tenant_id,
        uploaded_by_account_id=account.id if account else None,
        kind=validated_kind,
        storage_provider=MediaStorageProvider.LOCAL,
        storage_key=storage_key,
        public_url=public_url,
        original_filename=filename or "upload",
        mime_type=mime_type,
        size_bytes=len(content),
        status=MediaAssetStatus.ACTIVE,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return _asset_to_dict(asset)


def list_media(db, tenant_id: str) -> list[dict]:
    _get_tenant_or_404(db, tenant_id)
    rows = (
        db.query(MediaAsset)
        .filter(
            MediaAsset.tenant_id == tenant_id,
            MediaAsset.status == MediaAssetStatus.ACTIVE,
        )
        .order_by(MediaAsset.created_at.desc())
        .all()
    )
    return [_asset_to_dict(row) for row in rows]


def delete_media(db, tenant_id: str, asset_id: str) -> dict:
    _get_tenant_or_404(db, tenant_id)
    asset = db.get(MediaAsset, asset_id)
    if not asset or asset.tenant_id != tenant_id:
        raise AppError(ApiErrorCode.NOT_FOUND, "Media asset not found", status_code=404)
    if asset.status == MediaAssetStatus.DELETED:
        return {"deleted": True, "id": asset_id}

    asset.status = MediaAssetStatus.DELETED
    asset.deleted_at = datetime.now(UTC)
    asset.updated_at = datetime.now(UTC)
    db.commit()
    return {"deleted": True, "id": asset_id}


def count_media_by_kind(db, tenant_id: str) -> dict[str, int]:
    rows = (
        db.query(MediaAsset.kind)
        .filter(
            MediaAsset.tenant_id == tenant_id,
            MediaAsset.status == MediaAssetStatus.ACTIVE,
        )
        .all()
    )
    counts: dict[str, int] = {}
    for (kind,) in rows:
        counts[kind] = counts.get(kind, 0) + 1
    return counts


def _asset_to_dict(asset: MediaAsset) -> dict:
    return {
        "id": asset.id,
        "tenantId": asset.tenant_id,
        "kind": asset.kind,
        "publicUrl": asset.public_url,
        "originalFilename": asset.original_filename,
        "mimeType": asset.mime_type,
        "sizeBytes": asset.size_bytes,
        "width": asset.width,
        "height": asset.height,
        "status": asset.status,
        "createdAt": asset.created_at.isoformat().replace("+00:00", "Z"),
        "updatedAt": asset.updated_at.isoformat().replace("+00:00", "Z"),
    }
