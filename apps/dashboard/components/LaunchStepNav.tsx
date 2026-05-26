"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { SurfaceType } from "@astro/tenant-config";
import { ensureSurfaces, isSurfaceEnabled } from "@astro/tenant-config";
import { useT } from "@astro/i18n";
import { useDashboard } from "../app/components/DashboardProvider";
import { getStepCompletionState } from "../lib/launch-progress";

const STEPS = [
  { href: "start", labelKey: "dashboard.launch.stepStart", icon: "🚀", surfaceType: null },
  { href: "branding", labelKey: "dashboard.launch.stepBranding", icon: "✨", surfaceType: null },
  { href: "design", labelKey: "dashboard.launch.stepDesign", icon: "🎨", surfaceType: null },
  { href: "products", labelKey: "dashboard.launch.stepProducts", icon: "📦", surfaceType: null },
  { href: "telegram", labelKey: "dashboard.launch.stepTelegram", icon: "✈️", surfaceType: "telegram_mini_app" as SurfaceType },
  { href: "website", labelKey: "dashboard.launch.stepWebsite", icon: "🌐", surfaceType: "website" as SurfaceType },
  { href: "mobile", labelKey: "dashboard.launch.stepMobile", icon: "📱", surfaceType: "mobile_web" as SurfaceType },
  { href: "publish", labelKey: "dashboard.launch.stepPublish", icon: "🚢", surfaceType: null },
] as const;

export function LaunchStepNav() {
  const t = useT();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenantId") ?? "tenant_mystic";
  const { config } = useDashboard();

  const miniApp = config ? ensureSurfaces(config.miniApp, config.slug) : undefined;

  return (
    <nav className="-mx-1 overflow-x-auto pb-1">
      <div className="flex min-w-max gap-2 px-1">
        {STEPS.map((step, index) => {
          const href = `/launch/${step.href}?tenantId=${tenantId}`;
          const active = pathname.includes(`/launch/${step.href}`);
          const surfaceEnabled = step.surfaceType
            ? isSurfaceEnabled(miniApp, step.surfaceType)
            : true;
          const dimmed = step.surfaceType && !surfaceEnabled;
          const completion = config && step.href !== "publish"
            ? getStepCompletionState(step.href, config)
            : config && step.href === "publish"
              ? getStepCompletionState("publish", config)
              : null;

          return (
            <Link
              key={step.href}
              href={href}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "border-violet-500 bg-violet-600 text-white shadow-md shadow-violet-900/30"
                  : dimmed
                    ? "border-slate-800 bg-slate-950 text-slate-600 hover:border-slate-700 hover:text-slate-400"
                    : completion === "missing"
                      ? "border-amber-500/30 bg-slate-900 text-amber-200/90 hover:border-amber-500/50"
                      : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                  active ? "bg-white/20" : "bg-slate-800"
                }`}
                aria-hidden
              >
                {step.icon}
              </span>
              <span className="flex flex-col items-start">
                <span className="text-[10px] uppercase tracking-wide opacity-60">
                  {index + 1}
                </span>
                <span className="whitespace-nowrap font-medium">{t(step.labelKey)}</span>
              </span>
              {completion === "done" && (
                <span className="text-emerald-400" aria-label="complete">
                  ✓
                </span>
              )}
              {completion === "warning" && !dimmed && (
                <span className="text-amber-400" aria-label="warning">
                  !
                </span>
              )}
              {dimmed && (
                <span className="text-[10px] uppercase opacity-60">
                  ({t("dashboard.launch.stepNotSelected")})
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
