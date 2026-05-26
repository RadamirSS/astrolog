# Документация Astro Platform

Платформа для астрологов и блогеров: Creator Dashboard (Launch Studio), публикация на Website / Mobile Web / Telegram Mini App, checkout через платформу, entitlements, финансы и closed pilot.

---

## По ролям

### Frontend-разработчик

1. **[FRONTEND_BACKEND_CONNECTION.md](./FRONTEND_BACKEND_CONNECTION.md)** — главный handoff-документ
2. [PUBLIC_SURFACES.md](./PUBLIC_SURFACES.md) — маршрутизация публичных поверхностей
3. [API_CONTRACTS.md](./API_CONTRACTS.md) — контракты API
4. [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) — только `NEXT_PUBLIC_*` на клиенте

### Backend-разработчик (SaaS API)

1. [ARCHITECTURE.md](./ARCHITECTURE.md)
2. [SAAS_API_CONTRACT.md](./SAAS_API_CONTRACT.md)
3. [COMMERCE_LEDGER.md](./COMMERCE_LEDGER.md)
4. [INTEGRATIONS.md](./INTEGRATIONS.md)

### Astro backend

1. [ASTRO_API_CONTRACT.md](./ASTRO_API_CONTRACT.md) — Report Schema V2

### Payment backend

1. [PAYMENT_API_CONTRACT.md](./PAYMENT_API_CONTRACT.md)

### Владелец / админ / операции пилота

1. [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) — бизнес-модель
2. [CLOSED_PILOT_RUNBOOK.md](./CLOSED_PILOT_RUNBOOK.md)
3. [CLOSED_PILOT_PAYOUT_RUNBOOK.md](./CLOSED_PILOT_PAYOUT_RUNBOOK.md)
4. [REFUND_ADJUSTMENT_PROCESS.md](./REFUND_ADJUSTMENT_PROCESS.md)
5. [QA_CHECKLIST.md](./QA_CHECKLIST.md)
6. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### Cursor / будущие пакеты

1. [ARCHITECTURE.md](./ARCHITECTURE.md)
2. [FRONTEND_BACKEND_CONNECTION.md](./FRONTEND_BACKEND_CONNECTION.md)
3. [API_CONTRACTS.md](./API_CONTRACTS.md)
4. [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## Полный список документов

| Документ | Описание |
|----------|----------|
| [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) | Обзор платформы и бизнес-модель |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Архитектура сервисов и границы |
| [FRONTEND_BACKEND_CONNECTION.md](./FRONTEND_BACKEND_CONNECTION.md) | Связь frontend ↔ backend |
| [API_CONTRACTS.md](./API_CONTRACTS.md) | Индекс API-контрактов |
| [SAAS_API_CONTRACT.md](./SAAS_API_CONTRACT.md) | SaaS API — детали |
| [ASTRO_API_CONTRACT.md](./ASTRO_API_CONTRACT.md) | Astro API V2 |
| [PAYMENT_API_CONTRACT.md](./PAYMENT_API_CONTRACT.md) | Payment API |
| [TELEGRAM_BOT_INTEGRATION.md](./TELEGRAM_BOT_INTEGRATION.md) | Подключение Telegram-бота |
| [CREATOR_DASHBOARD.md](./CREATOR_DASHBOARD.md) | Launch Studio / Dashboard |
| [PUBLIC_SURFACES.md](./PUBLIC_SURFACES.md) | Публичные поверхности |
| [COMMERCE_LEDGER.md](./COMMERCE_LEDGER.md) | Ledger, комиссии, балансы |
| [CLOSED_PILOT_RUNBOOK.md](./CLOSED_PILOT_RUNBOOK.md) | Операции closed pilot |
| [CLOSED_PILOT_PAYOUT_RUNBOOK.md](./CLOSED_PILOT_PAYOUT_RUNBOOK.md) | Ручные выплаты |
| [REFUND_ADJUSTMENT_PROCESS.md](./REFUND_ADJUSTMENT_PROCESS.md) | Возвраты и корректировки |
| [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) | Переменные окружения |
| [INTEGRATIONS.md](./INTEGRATIONS.md) | Astro / Payment / Telegram |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Деплой |
| [QA_CHECKLIST.md](./QA_CHECKLIST.md) | QA перед пилотом |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Типичные ошибки |

**Исторические документы:** [docs/legacy/README.md](../legacy/README.md)

**UI i18n (EN):** [docs/I18N_GUIDE.md](../I18N_GUIDE.md)
