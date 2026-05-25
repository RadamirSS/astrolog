import hashlib
import hmac
import json
import time
from dataclasses import dataclass
from urllib.parse import parse_qsl

from backend_common.errors import ApiErrorCode, AppError

from saas_api.settings import settings

MAX_AUTH_AGE_SECONDS = 86400


@dataclass(frozen=True)
class TelegramUserData:
    telegram_id: str
    telegram_username: str | None
    first_name: str | None
    last_name: str | None
    language_code: str | None


def _parse_init_data(init_data: str) -> dict[str, str]:
    return {key: value for key, value in parse_qsl(init_data, keep_blank_values=True)}


def _build_data_check_string(parsed: dict[str, str]) -> str:
    pairs = []
    for key in sorted(parsed.keys()):
        if key == "hash":
            continue
        pairs.append(f"{key}={parsed[key]}")
    return "\n".join(pairs)


def _compute_telegram_hash(data_check_string: str, bot_token: str) -> str:
    secret_key = hmac.new(b"WebAppData", bot_token.encode("utf-8"), hashlib.sha256).digest()
    return hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()


def _extract_user(parsed: dict[str, str]) -> TelegramUserData:
    user_raw = parsed.get("user")
    if not user_raw:
        raise AppError(ApiErrorCode.UNAUTHORIZED, "Telegram user data missing", status_code=401)
    try:
        user = json.loads(user_raw)
    except json.JSONDecodeError as exc:
        raise AppError(
            ApiErrorCode.UNAUTHORIZED, "Invalid Telegram user payload", status_code=401
        ) from exc
    telegram_id = str(user.get("id", "")).strip()
    if not telegram_id:
        raise AppError(ApiErrorCode.UNAUTHORIZED, "Telegram user id missing", status_code=401)
    return TelegramUserData(
        telegram_id=telegram_id,
        telegram_username=user.get("username"),
        first_name=user.get("first_name"),
        last_name=user.get("last_name"),
        language_code=user.get("language_code"),
    )


def _validate_auth_date(parsed: dict[str, str]) -> None:
    auth_date_raw = parsed.get("auth_date")
    if not auth_date_raw:
        raise AppError(ApiErrorCode.UNAUTHORIZED, "Telegram auth_date missing", status_code=401)
    try:
        auth_date = int(auth_date_raw)
    except ValueError as exc:
        raise AppError(ApiErrorCode.UNAUTHORIZED, "Invalid auth_date", status_code=401) from exc
    if time.time() - auth_date > MAX_AUTH_AGE_SECONDS:
        raise AppError(ApiErrorCode.UNAUTHORIZED, "Telegram initData expired", status_code=401)


def _parse_dev_init_data(init_data: str) -> TelegramUserData | None:
    if settings.app_env != "development" or not settings.allow_dev_telegram_auth:
        return None
    parsed = _parse_init_data(init_data)
    if parsed.get("dev_mode") != "1":
        return None
    telegram_id = parsed.get("dev_user_id", "").strip()
    if not telegram_id:
        raise AppError(ApiErrorCode.UNAUTHORIZED, "dev_user_id required in dev initData", status_code=401)
    return TelegramUserData(
        telegram_id=telegram_id,
        telegram_username=parsed.get("dev_username"),
        first_name=parsed.get("dev_first_name"),
        last_name=parsed.get("dev_last_name"),
        language_code=parsed.get("dev_language_code"),
    )


def validate_telegram_init_data(init_data: str) -> TelegramUserData:
    if not init_data or not init_data.strip():
        raise AppError(ApiErrorCode.UNAUTHORIZED, "initData is required", status_code=401)

    dev_user = _parse_dev_init_data(init_data)
    if dev_user is not None:
        return dev_user

    bot_token = settings.telegram_bot_token.strip()
    if not bot_token:
        if settings.app_env == "development" and settings.allow_dev_telegram_auth:
            raise AppError(
                ApiErrorCode.UNAUTHORIZED,
                "Telegram bot token missing; use documented dev initData with dev_mode=1",
                status_code=401,
            )
        raise AppError(
            ApiErrorCode.UNAUTHORIZED,
            "Telegram authentication is not configured",
            status_code=401,
        )

    parsed = _parse_init_data(init_data)
    received_hash = parsed.get("hash")
    if not received_hash:
        raise AppError(ApiErrorCode.UNAUTHORIZED, "Telegram hash missing", status_code=401)

    data_check_string = _build_data_check_string(parsed)
    calculated_hash = _compute_telegram_hash(data_check_string, bot_token)
    if not hmac.compare_digest(calculated_hash, received_hash):
        raise AppError(ApiErrorCode.UNAUTHORIZED, "Invalid Telegram initData signature", status_code=401)

    _validate_auth_date(parsed)
    return _extract_user(parsed)


def build_test_init_data(bot_token: str, user: dict, auth_date: int | None = None) -> str:
    """Build deterministic initData for unit tests."""
    auth_ts = auth_date if auth_date is not None else int(time.time())
    user_json = json.dumps(user, separators=(",", ":"))
    parsed = {
        "auth_date": str(auth_ts),
        "query_id": "AAHdF6IQAAAAAN0XohDhrOrc",
        "user": user_json,
    }
    calculated_hash = _compute_telegram_hash(_build_data_check_string(parsed), bot_token)
    return (
        f"auth_date={auth_ts}&query_id={parsed['query_id']}"
        f"&user={user_json}&hash={calculated_hash}"
    )
