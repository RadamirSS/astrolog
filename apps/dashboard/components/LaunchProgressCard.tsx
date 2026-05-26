"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { TenantConfig } from "@astro/tenant-config";
import { useT } from "@astro/i18n";
import { SectionCard } from "@astro/ui";
import { buildLaunchProgressSteps, type LaunchProgressState } from "../lib/launch-progress";

interface LaunchProgressCardProps {
  config: TenantConfig;
}

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

export function LaunchProgressCard({ config }: LaunchProgressCardProps) {
  const t = useT();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenantId") ?? "tenant_mystic";
  const steps = buildLaunchProgressSteps(config);

  return (
    <SectionCard title={t("dashboard.controlCenter.launchProgress")}>
      <ul className="space-y-1">
        {steps.map((step) => {
          const content = (
            <span className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm">
              <span
                className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${stateClasses(step.state)}`}
              >
                {stateIcon(step.state)}
              </span>
              <span className={step.state === "done" ? "text-slate-200" : "text-slate-400"}>
                {t(step.labelKey)}
              </span>
            </span>
          );

          if (step.href) {
            return (
              <li key={step.id}>
                <Link
                  href={`/launch/${step.href}?tenantId=${tenantId}`}
                  className="block transition-colors hover:bg-slate-800/50"
                >
                  {content}
                </Link>
              </li>
            );
          }

          return <li key={step.id}>{content}</li>;
        })}
      </ul>
    </SectionCard>
  );
}
