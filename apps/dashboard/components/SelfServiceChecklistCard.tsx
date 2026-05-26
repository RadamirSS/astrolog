"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { TenantConfig } from "@astro/tenant-config";
import { useT } from "@astro/i18n";
import { SectionCard } from "@astro/ui";
import {
  buildSelfServiceChecklist,
  type ChecklistItemState,
} from "../lib/creator-self-service";

interface SelfServiceChecklistCardProps {
  config: TenantConfig;
  previewVerified?: boolean;
}

function stateIcon(state: ChecklistItemState): string {
  if (state === "done") return "✓";
  if (state === "warning") return "!";
  return "·";
}

function stateClasses(state: ChecklistItemState): string {
  if (state === "done") return "bg-emerald-500/20 text-emerald-400";
  if (state === "warning") return "bg-amber-500/20 text-amber-400";
  return "bg-slate-800 text-slate-500";
}

export function SelfServiceChecklistCard({
  config,
  previewVerified = false,
}: SelfServiceChecklistCardProps) {
  const t = useT();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenantId") ?? "tenant_mystic";
  const items = buildSelfServiceChecklist(config, previewVerified);

  return (
    <SectionCard title={t("dashboard.launch.checklistTitle")}>
      <ul className="space-y-1">
        {items.map((item) => {
          const content = (
            <span className="flex items-start gap-3 rounded-lg px-2 py-2.5">
              <span
                className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${stateClasses(item.state)}`}
              >
                {stateIcon(item.state)}
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-sm ${item.state === "done" ? "text-slate-200" : "text-slate-400"}`}
                >
                  {t(item.labelKey)}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">{t(item.explanationKey)}</span>
              </span>
            </span>
          );

          return (
            <li key={item.id}>
              <Link
                href={`/${item.href}?tenantId=${tenantId}`}
                className="block transition-colors hover:bg-slate-800/50"
              >
                {content}
              </Link>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
