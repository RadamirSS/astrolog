from datetime import UTC, datetime

from sqlalchemy.orm import Session

from saas_api.auth.passwords import new_id
from saas_api.auth.telegram import TelegramUserData
from saas_api.db.models.end_user import EndUser
from saas_api.schemas.telegram import EndUserSummary


def end_user_to_summary(end_user: EndUser) -> EndUserSummary:
    return EndUserSummary(
        id=end_user.id,
        tenantId=end_user.tenant_id,
        telegramId=end_user.telegram_id,
        telegramUsername=end_user.telegram_username,
        firstName=end_user.first_name,
        lastName=end_user.last_name,
        languageCode=end_user.language_code,
    )


def upsert_end_user(
    db: Session,
    *,
    tenant_id: str,
    user_data: TelegramUserData,
) -> EndUser:
    now = datetime.now(UTC)
    end_user = (
        db.query(EndUser)
        .filter(EndUser.tenant_id == tenant_id, EndUser.telegram_id == user_data.telegram_id)
        .first()
    )
    if end_user:
        end_user.telegram_username = user_data.telegram_username
        end_user.first_name = user_data.first_name
        end_user.last_name = user_data.last_name
        end_user.language_code = user_data.language_code
        end_user.last_seen_at = now
        end_user.updated_at = now
    else:
        end_user = EndUser(
            id=new_id("eu"),
            tenant_id=tenant_id,
            telegram_id=user_data.telegram_id,
            telegram_username=user_data.telegram_username,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            language_code=user_data.language_code,
            created_at=now,
            updated_at=now,
            last_seen_at=now,
        )
        db.add(end_user)
    db.commit()
    db.refresh(end_user)
    return end_user
