# i18n Guide

Package 7 adds English and Russian localization across the white-label astrology platform.

## Supported locales

| Code | Language |
|------|----------|
| `en` | English (default) |
| `ru` | Russian |

## Locale resolution order

1. URL query parameter: `?lang=ru` or `?locale=ru`
2. `localStorage` key: `astro_locale`
3. Browser language (`navigator.language`) if supported
4. `NEXT_PUBLIC_DEFAULT_LOCALE` (default: `en`)
5. Fallback: `en`

No locale-prefixed routes (`/ru/...`) are used in this package.

## Environment

```bash
NEXT_PUBLIC_DEFAULT_LOCALE=en
```

## Architecture

- **`@astro/i18n`** — shared dictionaries, `I18nProvider`, `useT()`, `LocaleSwitcher`
- **`TenantConfig.locales.ru`** — optional tenant content overlays (backwards-compatible)
- **`localizeTenantConfig(config, locale)`** — merges RU overlays at runtime
- **`mockReportsRu`** — Russian mock report fixtures in `@astro/mock-api`

Each app wraps its tree in `I18nProvider` via `app/providers.tsx`.

## Dictionary structure

Nested TypeScript objects in:

```
packages/i18n/src/dictionaries/
  en.ts   # source of truth
  ru.ts   # Russian overrides merged with en for missing keys
```

Namespaces:

| Namespace | Used by |
|-----------|---------|
| `common.*` | Shared actions |
| `miniapp.*` | Mini App runtime |
| `dashboard.*` | Blogger dashboard |
| `superadmin.*` | Superadmin |
| `ui.*` | `@astro/ui` defaults |
| `report.*` | `@astro/report-renderer` chrome |

Usage:

```tsx
import { useT } from "@astro/i18n";

const t = useT();
t("dashboard.publish.title");
t("miniapp.loading.craftingFrom", { displayName: "Mystic Veil" });
```

## Adding a new locale

1. Add locale code to `AppLocale` and `SUPPORTED_LOCALES` in `packages/i18n/src/core.ts`
2. Create `packages/i18n/src/dictionaries/{code}.ts`
3. Register in `getDictionary()` merge logic
4. Add `LocaleSwitcher` option
5. Optionally extend `TenantConfig.locales` schema

## Localizing tenant content

English remains the canonical config in the dashboard editor. For demo/localized tenant copy, add optional overlays:

```ts
tenantConfig.locales = {
  ru: {
    brand: { tagline: "...", bio: "..." },
    content: {
      home: { headline: "...", ctaLabel: "..." },
      loadingMessages: ["..."],
    },
    products: {
      "product-id": { title: "...", priceLabel: "€29" },
    },
  },
};
```

Apply at runtime:

```ts
import { localizeTenantConfig } from "@astro/tenant-config";

const localized = localizeTenantConfig(config, locale);
```

## Localizing mock reports

Add entries to `packages/mock-api/src/fixtures/reports-ru.ts` keyed by `tenantId`. `mockGenerateFreeReport` selects the map based on `options.locale`.

## What should NOT be translated

- Route paths (`/mystic-dark`, `/overview`)
- API endpoint paths
- Analytics event names (`tenant_home_viewed`, etc.)
- Type names, product IDs, tenant IDs, slugs
- Theme preset IDs (`mystic-dark`, etc.)
- Brand names unless explicitly overridden in tenant locale data

## Demo URLs

| Surface | English | Russian |
|---------|---------|---------|
| Demo launcher | `/tenants` | `/tenants?lang=ru` |
| Mystic Dark | `/mystic-dark` | `/mystic-dark?lang=ru` |
| Soft Feminine | `/soft-feminine` | `/soft-feminine?lang=ru` |
| Luxury Gold | `/luxury-gold` | `/luxury-gold?lang=ru` |
| Dashboard | `/overview?tenantId=tenant_mystic` | `/overview?tenantId=tenant_mystic&lang=ru` |

## Known limitations

- Dashboard edits English base config only; RU tenant copy is overlay/fixture-driven
- Non-pilot tenants may lack full RU content/report overlays
- Remote API adapter ignores locale unless backend adds support
- Zod internal validation messages may remain English

See also: [I18N_AUDIT.md](./I18N_AUDIT.md)
