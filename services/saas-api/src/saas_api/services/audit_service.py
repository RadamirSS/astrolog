from saas_api.auth.passwords import new_id
from saas_api.db.models.audit_log import AuditLog


def log_action(
    db,
    *,
    action: str,
    actor_account_id: str | None = None,
    tenant_id: str | None = None,
    payload: dict | None = None,
) -> None:
    entry = AuditLog(
        id=new_id("audit"),
        actor_account_id=actor_account_id,
        tenant_id=tenant_id,
        action=action,
        payload_json=payload,
    )
    db.add(entry)


def list_audit_logs(
    db,
    *,
    tenant_id: str | None = None,
    action: str | None = None,
    limit: int = 50,
) -> list[dict]:
    query = db.query(AuditLog)
    if tenant_id:
        query = query.filter(AuditLog.tenant_id == tenant_id)
    if action:
        query = query.filter(AuditLog.action == action)
    rows = query.order_by(AuditLog.created_at.desc()).limit(min(limit, 200)).all()
    return [
        {
            "id": row.id,
            "actorAccountId": row.actor_account_id,
            "tenantId": row.tenant_id,
            "action": row.action,
            "payload": row.payload_json,
            "createdAt": row.created_at.isoformat().replace("+00:00", "Z"),
        }
        for row in rows
    ]
