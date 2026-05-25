# i18n Audit — Package 7

Audit date: 2026-05-23

## Localized app areas

| Area | Status | Notes |
|------|--------|-------|
| Mini App nav & screens | Localized | All 7 screens + bottom nav |
| Mini App launcher (`/tenants`) | Localized | LocaleSwitcher in header |
| Mini App 404 | Localized | |
| Report renderer chrome | Localized | Title, insights, locked, recommended |
| Dashboard sidebar & topbar | Localized | LocaleSwitcher in topbar |
| Dashboard builder pages | Localized | Overview through Settings + placeholders |
| Superadmin shell & tenants | Localized | List, detail, create form |
| Shared UI defaults | Localized | Loading, dialogs, badges, product card |
| Pilot tenant content (RU) | Localized | mystic-dark, soft-feminine, luxury-gold |
| Pilot mock reports (RU) | Localized | tenant_mystic, tenant_soft, tenant_luxury |

## Accepted non-translatable terms

- Analytics keys: `tenant_home_viewed`, `product_clicked`, etc.
- Route paths and slugs
- API paths and envelope fields
- Theme preset IDs
- Product/tenant IDs
- Brand display names (unless overridden in `locales.ru`)
- Telegram, Instagram, WhatsApp (channel names)

## Static grep results (post-implementation)

Run from repo root:

```bash
grep -R "Go live" apps packages --include='*.tsx' --include='*.ts'
grep -R "Coming later" apps packages --include='*.tsx' --include='*.ts'
grep -R "Draft Preview" apps packages
grep -R "Published Preview" apps packages
grep -R "Main button text" apps packages
grep -R "Lorem ipsum" .
grep -R "example.com" .
```

Expected: matches only in `packages/i18n/src/dictionaries/en.ts` and documentation — not in hardcoded UI components.

## Known non-localized / internal areas

- Dashboard tenant **editor content** remains English (bloggers edit EN canonical config)
- `packages/miniapp-renderer/src/context.tsx` preview seed data (dashboard preview only)
- Zod schema error strings in `@astro/tenant-config`
- Theme preset IDs in `theme-engine` (labels localized in dashboard via dictionary)
- cosmic-guide, luna-astro: UI chrome localized; tenant/report RU overlays not fully curated

## Remaining limitations

- No pluralization rules (simple `{param}` interpolation only)
- No RTL locale support
- No server-side locale negotiation beyond client `I18nProvider`
- Remote mode: locale not sent to backend HTTP APIs

## Next recommended step

**Russian Localization Audit / i18n QA** — native-speaker review of RU copy, layout checks on mobile/dashboard, and stakeholder sign-off on demo URLs.
