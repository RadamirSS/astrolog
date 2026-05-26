"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { TenantConfig } from "@astro/tenant-config";
import { useT } from "@astro/i18n";
import { buildLaunchProgressSteps, type LaunchProgressState } from "../lib/launch-progress";

function stateIcon(state: LaunchProgressState): string {
  if (state === "done") return "✓";
  if (state === "warning") return "!";
  return "·";
}

function stateClasses(state: LaunchProgressState): string {
  if (state === "done") return "bg-emerald-500/20 text-emerald-400";
  if (state === "warning") return "bg-amber-500/20 text-amber-400";
  return "bg-slate-800 text-slate-500";
}

export function LaunchChecklist({ config }: { config: TenantConfig }) {
  const t = useT();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenantId") ?? "tenant_mystic";
  const items = buildLaunchProgressSteps(config).filter((s) => s.id !== "published");

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
      <h3 className="mb-3 text-sm font-medium text-slate-300">
        {t("dashboard.launch.checklistTitle")}
      </h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const content = (
            <span className="flex items-center gap-2 text-sm">
              <span
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${stateClasses(item.state)}`}
              >
                {stateIcon(item.state)}
              </span>
              <span className={item.state === "done" ? "text-slate-300" : "text-slate-400"}>
                {t(item.labelKey)}
              </span>
            </span>
          );

          if (item.href) {
            return (
              <li key={item.id}>
                <Link
                  href={`/launch/${item.href}?tenantId=${tenantId}`}
                  className="block rounded-lg px-2 py-1 transition-colors hover:bg-slate-800/60"
                >
                  {content}
                </Link>
              </li>
            );
          }

          return <li key={item.id}>{content}</li>;
        })}
      </ul>
    </div>
  );
}

/** @deprecated Use buildLaunchProgressSteps from lib/launch-progress */
export { buildLaunchProgressSteps as buildLaunchChecklist } from "../lib/launch-progress";
