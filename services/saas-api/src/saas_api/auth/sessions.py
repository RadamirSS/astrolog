from datetime import UTC, datetime, timedelta

import jwt
from fastapi import Response

from saas_api.settings import settings


def create_session_token(*, account_id: str, email: str, role: str) -> str:
    expires = datetime.now(UTC) + timedelta(hours=settings.saas_session_ttl_hours)
    payload = {
        "sub": account_id,
        "email": email,
        "role": role,
        "exp": expires,
    }
    return jwt.encode(payload, settings.saas_session_secret, algorithm="HS256")


def decode_session_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.saas_session_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def create_end_user_session_token(*, end_user_id: str, tenant_id: str, telegram_id: str) -> str:
    expires = datetime.now(UTC) + timedelta(hours=settings.end_user_session_ttl_hours)
    payload = {
        "sub": end_user_id,
        "tenant_id": tenant_id,
        "telegram_id": telegram_id,
        "kind": "end_user",
        "exp": expires,
    }
    return jwt.encode(payload, settings.saas_session_secret, algorithm="HS256")


def decode_end_user_session_token(token: str) -> dict | None:
    payload = decode_session_token(token)
    if not payload or payload.get("kind") != "end_user":
        return None
    return payload


def set_end_user_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.end_user_cookie_name,
        value=token,
        httponly=True,
        secure=settings.saas_cookie_secure,
        samesite=settings.saas_cookie_samesite,
        domain=settings.saas_cookie_domain,
        max_age=settings.end_user_session_ttl_hours * 3600,
        path="/",
    )


def clear_end_user_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.end_user_cookie_name,
        domain=settings.saas_cookie_domain,
        path="/",
    )


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.saas_cookie_name,
        value=token,
        httponly=True,
        secure=settings.saas_cookie_secure,
        samesite=settings.saas_cookie_samesite,
        domain=settings.saas_cookie_domain,
        max_age=settings.saas_session_ttl_hours * 3600,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.saas_cookie_name,
        domain=settings.saas_cookie_domain,
        path="/",
    )
