> **Исторический документ / Historical doc.** Актуальная версия: см. [docs/legacy/README.md](../legacy/README.md) для карты замены.

---

# Demo Guide — Pilot Presentations

This guide walks through running and demonstrating the white-label astrology platform in **mock mode** (no real backend required).

## Quick start

```bash
pnpm install
cp .env.example .env.local   # optional — defaults work for mock mode
pnpm dev
```

| App | URL | Purpose |
|-----|-----|---------|
| Mini App | http://localhost:3000 | End-user experience |
| Dashboard | http://localhost:3001 | Blogger builder |
| Superadmin | http://localhost:3002 | Platform control |

Ensure `NEXT_PUBLIC_API_MODE=mock` (default in `.env.example`).

## Russian demo (Package 7)

Add `?lang=ru` to any URL, or use the **EN / RU** locale switcher in the app topbar (Mini App launcher, profile footer, Dashboard, Superadmin).

| Tenant | Russian Mini App URL |
|--------|----------------------|
| Demo launcher | http://localhost:3000/tenants?lang=ru |
| Mystic Veil | http://localhost:3000/mystic-dark?lang=ru |
| Rose Moon | http://localhost:3000/soft-feminine?lang=ru |
| Celestial Elite | http://localhost:3000/luxury-gold?lang=ru |

Dashboard (Russian UI): http://localhost:3001/overview?tenantId=tenant_mystic&lang=ru

For pilot tenants, home copy, products, FAQ, loading messages, and free reports switch to curated Russian content when `lang=ru`. Platform chrome (nav, buttons, errors) is also localized.

See [I18N_GUIDE.md](./I18N_GUIDE.md) for locale resolution and dictionary structure.

## Demo launcher

Open **http://localhost:3000/tenants** for a curated list of demo tenants with quick links to the mini app and dashboard.

### Recommended pilot tenants

| Tenant | Mini App URL | Dashboard |
|--------|--------------|-----------|
| Mystic Veil (mysterious / premium) | http://localhost:3000/mystic-dark | http://localhost:3001/overview?tenantId=tenant_mystic |
| Rose Moon (soft / relationship) | http://localhost:3000/soft-feminine | http://localhost:3001/overview?tenantId=tenant_soft |
| Celestial Elite (luxury / VIP) | http://localhost:3000/luxury-gold | http://localhost:3001/overview?tenantId=tenant_luxury |

Optional extras:

- **Cosmic Guide** — http://localhost:3000/cosmic-guide
- **Luna Astro** — draft vs live demo — http://localhost:3000/luna-astro

## 10-minute demo script

### 1. End-user journey (Mini App) — ~4 min

1. Open http://localhost:3000/tenants → choose **Mystic Veil**
2. **Home** — hero, offerings, FAQ
3. Tap main CTA → **Onboarding** (name, birth details, focus topic)
4. **Loading** — generation animation
5. **Free reading** — summary, highlights, locked teaser, recommended offerings
6. **Shop** — product cards and detail pages
7. **Profile** — birth profile and reading history

Repeat briefly with **Rose Moon** or **Celestial Elite** to show theme/brand differences.

**Russian walkthrough (optional):** Open http://localhost:3000/mystic-dark?lang=ru — confirm Russian UI chrome, tenant headlines, product prices (€), and Russian free report copy.

### 2. Blogger dashboard — ~4 min

1. Open http://localhost:3001/overview?tenantId=tenant_mystic
2. **Overview** — status, pilot demo links, setup checklist
3. **Brand** or **Content** — edit copy, show auto-save / saved state
4. **Preview** — embedded mini app with “your changes” vs “live in app”
5. **Go live** — publish checklist, publish action
6. Open mini app live URL to confirm

### 3. Superadmin — ~2 min

1. Open http://localhost:3002/tenants
2. Show tenant cards, status (Live / Draft / Paused)
3. Preview draft vs live links
4. Open tenant detail → integrations marked **mock only**

## What is mock-only

- All API data from `@astro/mock-api`
- Report generation (curated fixture reports, not real calculations)
- Analytics events (stored in mock memory, no third-party provider)
- Dashboard activity stats (demo numbers)
- Superadmin tenant creation (in-memory)
- Birth profile / session persistence (localStorage + mock API)

## Intentionally not implemented

- Real Telegram authentication
- Payments / checkout / Telegram Stars
- Real astrology calculations or AI report generation
- Real backend / database
- PDF export, subscriptions, marketplace

See [API_CONTRACTS.md](./API_CONTRACTS.md) and [BACKEND_HANDOFF.md](./BACKEND_HANDOFF.md) for backend integration scope.

**API response rule:** successful responses are wrapped once as `{ ok: true, data: TenantConfig }` — never `{ ok: true, data: { config: TenantConfig } }`.

## Reset local demo state

Mini App stores birth profile and report in **localStorage** per tenant.

To reset the user journey in the browser:

1. Open DevTools → Application → Local Storage → `http://localhost:3000`
2. Delete keys matching `astro_session_*` (or clear all site data)
3. Reload the tenant URL

Alternatively use a private/incognito window for a fresh session.

## Verification commands

```bash
pnpm typecheck
pnpm build
pnpm lint
```

## Archive

```bash
pnpm archive
# creates archives/astrology-platform-package-7-i18n-ru.tar.gz
```

See [PILOT_READINESS_CHECKLIST.md](./PILOT_READINESS_CHECKLIST.md) and [I18N_AUDIT.md](./I18N_AUDIT.md) for acceptance checks.
