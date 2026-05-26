# Creator Dashboard / Launch Studio

Руководство по панели создателя: настройка mini-app, поверхностей, публикация.

**App:** `apps/dashboard` (port 3001)

---

## Основные разделы

| Route | Назначение |
|-------|------------|
| `/overview` | Прогресс настройки, quick links |
| `/setup`, `/brand`, `/design`, `/content`, `/products` | Builder editors |
| `/preview` | Embedded preview (7 экранов) |
| `/publish` | Publish flow с checklist |
| `/launch` | Launch Studio — surfaces, links, Telegram |
| `/settings` | Module toggles, integration status |
| `/ops/*` | Orders, finance, premium requests (role-gated) |

---

## Launch Studio flow

1. **Brand & design** — logo, colors, visual pack, typography
2. **Content** — hero, FAQ, consultation CTA
3. **Products** — enable/disable из approved catalog (7 типов)
4. **Surfaces** — выбор Website / Mobile Web / Telegram Mini App
5. **Telegram** (если выбран) — connect bot token
6. **Publish** — `POST /api/dashboard/tenants/{tenantId}/mini-app/publish`

---

## Creator mini-app API

| Method | Path | Назначение |
|--------|------|------------|
| GET | `/api/dashboard/tenants/{tenantId}/mini-app` | Load draft mini-app config |
| PUT | `/api/dashboard/tenants/{tenantId}/mini-app` | Save draft |
| POST | `.../mini-app/publish` | Publish draft → published |
| POST | `.../mini-app/unpublish` | Revert to draft-only |
| PUT | `.../surfaces/{surfaceId}` | Update surface config |
| PUT | `.../mini-app/surfaces/{surfaceType}/enabled` | Enable/disable surface |
| POST | `.../surfaces/{surfaceId}/publish` | Publish individual surface |
| GET | `.../surfaces/{surfaceId}/preview` | Preview URL + config |

`surfaceType`: `website`, `mobile_web`, `telegram_mini_app`

---

## Tenant config (legacy builder)

Параллельно с creator mini-app существует tenant config draft/publish:

| Method | Path |
|--------|------|
| GET/PUT | `/api/dashboard/tenants/{id}/config/draft` |
| GET | `/api/dashboard/tenants/{id}/config/published` |
| GET | `/api/dashboard/tenants/{id}/config/status` |
| POST | `/api/dashboard/tenants/{id}/publish` |

Launch Studio использует creator mini-app endpoints; tenant config — для совместимости и superadmin.

---

## Preview system

Dashboard embedded preview переиспользует `MiniAppRoot` из `@astro/miniapp-renderer`:

- **Draft Preview** — текущий draft config
- **Published Preview** — last published snapshot

Экраны: Home, Onboarding, Loading, Free Report, Products, Product Detail, Profile.

External link: `/{slug}?preview=draft` для draft; default URL для published.

---

## Ops / finance (creator-scoped)

Creators с `partner_id` видят только свои данные:

- Orders, payments (read)
- Commissions, balances (read)
- Premium requests (manage)

Platform admin видит всё + release/hold commissions, payouts, adjustments.

RBAC matrix: [CLOSED_PILOT_RUNBOOK.md](./CLOSED_PILOT_RUNBOOK.md).

---

## Auth

- Login: `POST /auth/login` → session cookie
- Current account: `GET /auth/me`
- Roles: `platform_owner`, `platform_admin`, `creator`, `viewer`

---

## Связанные документы

- [PUBLIC_SURFACES.md](./PUBLIC_SURFACES.md)
- [TELEGRAM_BOT_INTEGRATION.md](./TELEGRAM_BOT_INTEGRATION.md)
- [SAAS_API_CONTRACT.md](./SAAS_API_CONTRACT.md)
