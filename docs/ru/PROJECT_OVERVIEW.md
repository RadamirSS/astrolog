# Обзор проекта

Бизнес-модель и роли на платформе Astro.

---

## Роли

### Создатель (creator / astrologer / blogger)

- Входит в **Creator Dashboard**
- Настраивает брендинг, дизайн, продукты в **Launch Studio**
- Выбирает поверхности публикации: Website, Mobile Web, Telegram Mini App
- Подключает Telegram bot token **только если** выбрана Telegram-поверхность
- Публикует и делится ссылками
- Видит продажи, баланс, начисления, выплаты, Premium-заявки

### Конечный пользователь (end user)

- Открывает публичную ссылку создателя
- Выбирает тему: **money**, **relationships**, **personality**
- Вводит данные рождения
- Получает бесплатный мини-отчёт
- Видит paywall / детали продукта
- Оплачивает через **платформу** (не напрямую создателю)
- Получает доступ к отчёту через **entitlement**
- Видит отчёты в «Мои отчёты»
- Может отправить **Premium-заявку**

### Платформа

- Владеет каталогом продуктов и ценами
- Принимает платежи
- Проверяет статус оплаты через Payment API
- Создаёт orders / payments / entitlements
- Вызывает Astro API для генерации отчётов
- Записывает комиссии
- Ведёт балансы партнёров
- Обрабатывает **ручные выплаты** в closed pilot
- Автовыплаты — возможная интеграция позже

---

## Бизнес-модель (closed pilot)

1. **Создатели не подключают свои payment processors** — все платежи идут через платформу
2. **Платформа получает деньги** от end users через Payment API
3. **Комиссия начисляется** партнёру (creator) после оплаты
4. **Hold period** (default 7 дней) — комиссия в pending, затем release в available
5. **Выплаты manual** — оператор платформы создаёт payout, переводит вне системы, помечает paid

---

## Активные темы воронки (MVP)

| topic | Описание |
|-------|----------|
| `money` | Деньги, ресурсы |
| `relationships` | Отношения |
| `personality` | Личность |

---

## Активные продукты

| Продукт | productType | Цена | Режим |
|---------|-------------|------|-------|
| Мини-разбор (бесплатный) | `free_report` | $0 | free |
| Денежный код | `low_ticket_money` | $29 | checkout |
| Код отношений | `low_ticket_relationships` | $29 | checkout |
| Личностный портрет | `low_ticket_personality` | $29 | checkout |
| Bundle: 3 темы | `bundle_all_topics` | $79 | checkout (3 отчёта) |
| Полный астрологический портрет | `main_natal_portrait` | $149 | checkout |
| Premium-разбор | `premium_consultation` | по заявке | request mode |

Источник: `packages/tenant-config/src/product-catalog.ts`, server validation: `services/saas-api/src/saas_api/services/approved_product_catalog.py`

---

## Legacy / deprecated

Следующие темы и продукты **не являются активным MVP** и упоминаются только как deprecated/test-only если остались в коде:

- Topics: `purpose`, `career`, `family`, `compatibility`, `personal-path`
- Legacy product names: Shadow Self Report, Ritual Consultation, VIP Natal, Full Natal Chart, Lunar Ritual Guide, Executive Briefing и т.п.
- Поле `birthCity` — заменено на **`birthPlace`** в Report Schema V2

---

## Поверхности публикации

| Surface | surfaceType | Описание |
|---------|-------------|----------|
| Website | `website` | Публичный web-сайт создателя |
| Mobile Web | `mobile_web` | Мобильная web-версия |
| Telegram Mini App | `telegram_mini_app` | Mini App через bot создателя |

См. [PUBLIC_SURFACES.md](./PUBLIC_SURFACES.md), [CREATOR_DASHBOARD.md](./CREATOR_DASHBOARD.md).

---

## Связанные документы

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [FRONTEND_BACKEND_CONNECTION.md](./FRONTEND_BACKEND_CONNECTION.md)
- [COMMERCE_LEDGER.md](./COMMERCE_LEDGER.md)
- [CLOSED_PILOT_RUNBOOK.md](./CLOSED_PILOT_RUNBOOK.md)
