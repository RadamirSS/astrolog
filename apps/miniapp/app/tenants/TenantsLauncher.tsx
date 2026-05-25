"use client";

import Link from "next/link";
import type { TenantListItem } from "@astro/api-client";
import { LocaleSwitcher, useT } from "@astro/i18n";
import { StatusBadge } from "@astro/ui";

const PILOT_ORDER = ["mystic-dark", "soft-feminine", "luxury-gold"];
const THEME_SWATCHES: Record<string, string> = {
  "mystic-dark": "from-slate-900 to-violet-950",
  "soft-feminine": "from-rose-100 to-pink-200",
  "luxury-gold": "from-amber-900 to-yellow-900",
  "cosmic-guide": "from-violet-900 to-indigo-950",
  "luna-astro": "from-pink-900 to-purple-950",
};

const PILOT_DESCRIPTION_KEYS: Record<string, string> = {
  "mystic-dark": "miniapp.launcher.mysticDark",
  "soft-feminine": "miniapp.launcher.softFeminine",
  "luxury-gold": "miniapp.launcher.luxuryGold",
  "cosmic-guide": "miniapp.launcher.cosmicGuide",
  "luna-astro": "miniapp.launcher.lunaAstro",
};

interface TenantsLauncherProps {
  tenants: TenantListItem[];
  dashboardBase: string;
}

export function TenantsLauncher({ tenants, dashboardBase }: TenantsLauncherProps) {
  const t = useT();

  const sorted = [...tenants].sort((a, b) => {
    const ai = PILOT_ORDER.indexOf(a.slug);
    const bi = PILOT_ORDER.indexOf(b.slug);
    if (ai === -1 && bi === -1) return a.displayName.localeCompare(b.displayName);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-violet-400">
              {t("miniapp.launcher.eyebrow")}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-100">{t("miniapp.launcher.title")}</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {t("miniapp.launcher.description")}
            </p>
          </div>
          <LocaleSwitcher className="shrink-0" />
        </div>

        <div className="mt-8 flex flex-col gap-4">
          {sorted.map((tenant) => {
            const isPilot = PILOT_ORDER.includes(tenant.slug);
            const swatch = THEME_SWATCHES[tenant.slug] ?? "from-slate-800 to-slate-900";
            const descriptionKey = PILOT_DESCRIPTION_KEYS[tenant.slug];
            return (
              <article
                key={tenant.id}
                className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50"
              >
                <div className={`h-2 bg-gradient-to-r ${swatch}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-slate-100">{tenant.displayName}</h2>
                        {isPilot && (
                          <span className="rounded-full bg-violet-900/50 px-2 py-0.5 text-xs text-violet-300">
                            {t("miniapp.launcher.pilotBadge", {
                              number: PILOT_ORDER.indexOf(tenant.slug) + 1,
                            })}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{tenant.slug}</p>
                      {descriptionKey && (
                        <p className="mt-2 text-sm text-slate-400">{t(descriptionKey)}</p>
                      )}
                    </div>
                    <StatusBadge status={tenant.status} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/${tenant.slug}`}
                      className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-500"
                    >
                      {t("miniapp.launcher.openMiniApp")}
                    </Link>
                    <Link
                      href={`${dashboardBase}/overview?tenantId=${tenant.id}`}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-500"
                    >
                      {t("miniapp.launcher.dashboard")}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">{t("miniapp.launcher.footer")}</p>
      </div>
    </div>
  );
}
