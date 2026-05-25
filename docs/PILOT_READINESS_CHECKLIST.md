# Pilot Readiness Checklist

Use this checklist before showing the platform to pilot astrologer/blogger clients or internal stakeholders.

## Mini App

- [ ] `/tenants` demo launcher loads and lists all tenants
- [ ] Home hero, CTA, and spacing look premium on mobile viewport
- [ ] Onboarding flow completes with friendly validation messages
- [ ] Loading/generation screen animates smoothly
- [ ] Free report renders with summary, highlights, sections, locked teaser
- [ ] Locked section CTA routes to the correct offering when `unlockProductId` is set
- [ ] Products list and detail pages show realistic copy (no “payment integration” dev text)
- [ ] Profile shows birth profile and reading history
- [ ] Bottom navigation has icons and active state
- [ ] Broken image URLs fall back gracefully (`SafeImage`)
- [ ] Custom 404 links to `/tenants`
- [ ] Mock mode banner visible when `NEXT_PUBLIC_API_MODE=mock`

## i18n (Package 7)

- [ ] English demo works (default, no query param)
- [ ] Russian demo works via `?lang=ru` on mini app URLs
- [ ] Locale switcher works in Mini App (`/tenants`, profile), Dashboard topbar, Superadmin topbar
- [ ] Locale persists after page refresh (`astro_locale` in localStorage)
- [ ] Pilot tenant content localized for RU (mystic-dark, soft-feminine, luxury-gold)
- [ ] Free reports localized for RU on pilot tenants
- [ ] Dashboard UI localized (RU labels: «Опубликовать», «Предпросмотр черновика», etc.)
- [ ] Superadmin UI localized

## Dashboard

- [ ] Overview shows pilot tenant quick links and demo launcher link
- [ ] Copy uses blogger-friendly labels (“Main button text”, “Your changes”, “Go live”)
- [ ] Saved / unsaved state visible in top bar
- [ ] Product editor shows inline validation errors
- [ ] FAQ editor shows partial-fill validation errors
- [ ] Preview page explains draft vs live clearly
- [ ] Publish flow works end-to-end in mock mode
- [ ] Setup wizard completes and tracks progress
- [ ] No `example.com` placeholders in form hints

## Superadmin

- [ ] Tenant list readable on mobile (card layout)
- [ ] Status badges show Live / Draft / Paused
- [ ] Create tenant form works with error feedback
- [ ] Status change and preview links work
- [ ] Tenant detail shows friendly changed-area labels
- [ ] Integration cards marked mock-only

## Demo tenants

### Mystic Dark (`mystic-dark`)

- [ ] Believable brand, astrologer name, headline, subtitle
- [ ] 4–5 realistic offerings with price labels
- [ ] FAQ populated
- [ ] Curated free report with recommended products
- [ ] Brand/cover images load or fallback cleanly

### Soft Feminine (`soft-feminine`)

- [ ] Warm relationship-focused copy throughout
- [ ] 4 offerings including consultation and membership-style course
- [ ] FAQ with 3+ items
- [ ] Report matches love/relationship theme

### Luxury Gold (`luxury-gold`)

- [ ] VIP positioning and executive copy
- [ ] Free report enabled with curated luxury report fixture
- [ ] 5 premium offerings
- [ ] FAQ and loading messages present

### General

- [ ] No `Lorem ipsum` in user-facing copy
- [ ] No `example.com` in user-facing product CTAs or demo URLs
- [ ] No obviously fake internal names shown to end users

## Analytics (mock)

- [ ] Mini App core events fire (`miniapp_opened`, `tenant_home_viewed`, onboarding, report, products, profile)
- [ ] Dashboard events fire (open, setup, saves, preview, publish, discard)
- [ ] Superadmin events fire (open, create, status change, preview)
- [ ] Analytics failures do not break UI

## Backend contract

- [ ] [API_CONTRACTS.md](./API_CONTRACTS.md) documents single-wrap envelope `{ ok: true, data: T }`
- [ ] [BACKEND_HANDOFF.md](./BACKEND_HANDOFF.md) matches adapter expectations
- [ ] Mock and remote adapters share `@astro/api-contracts` types

## Archive hygiene

- [ ] `pnpm clean` run before archive
- [ ] No `._*` or `*.tsbuildinfo` files in tree
- [ ] Archive name: `archives/astrology-platform-package-7-i18n-ru.tar.gz`
- [ ] Verify command returns no excluded paths:

```bash
tar -tzf archives/astrology-platform-package-7-i18n-ru.tar.gz | grep -E '(^|/)\._|tsbuildinfo|node_modules|\.next|dist|\.turbo|(^|/)archives(/|$)'
```

- [ ] No LIBARCHIVE.xattr warnings when listing archive

## Build verification

- [ ] `pnpm install`
- [ ] `pnpm typecheck`
- [ ] `pnpm build`
- [ ] `pnpm lint`

## Known out-of-scope (confirm NOT present)

- [ ] No payment provider integration
- [ ] No astrology calculation engine
- [ ] No real backend dependency for demo
- [ ] No real Telegram auth
- [ ] No AI report generation

## Next step

After this checklist passes: **Russian Localization Audit / i18n QA** (native-speaker review using [I18N_AUDIT.md](./I18N_AUDIT.md)).
