"use client";

import type { SurfaceType } from "@astro/tenant-config";
import { Badge } from "@astro/ui";
import { useT } from "@astro/i18n";

interface SurfaceSelectionCardProps {
  type: SurfaceType;
  titleKey: string;
  descKey: string;
  bestForKey: string;
  enabled: boolean;
  recommended?: boolean;
  extraBadges?: string[];
  status: "disabled" | "enabled" | "needs_bot" | "ready";
  onToggle: () => void;
}

const SURFACE_ACCENTS: Record<SurfaceType, string> = {
  website:
    "border-sky-500/40 bg-gradient-to-br from-sky-950/40 to-slate-900/60 hover:border-sky-400/60",
  mobile_web:
    "border-violet-500/40 bg-gradient-to-br from-violet-950/30 to-slate-900/60 hover:border-violet-400/60",
  telegram_mini_app:
    "border-amber-500/40 bg-gradient-to-br from-amber-950/30 to-slate-900/60 hover:border-amber-400/60",
};

const SURFACE_ICONS: Record<SurfaceType, string> = {
  website: "🌐",
  mobile_web: "📱",
  telegram_mini_app: "✈️",
};

export function SurfaceSelectionCard({
  type,
  titleKey,
  descKey,
  bestForKey,
  enabled,
  recommended,
  extraBadges = [],
  status,
  onToggle,
}: SurfaceSelectionCardProps) {
  const t = useT();

  const statusLabel =
    status === "ready"
      ? t("dashboard.launch.surfaceReady")
      : status === "needs_bot"
        ? t("dashboard.launch.surfaceNeedsBot")
        : enabled
          ? t("dashboard.launch.surfaceEnabled")
          : t("dashboard.launch.surfaceDisabled");

  const statusVariant =
    status === "ready"
      ? "success"
      : status === "needs_bot"
        ? "warning"
        : enabled
          ? "info"
          : "neutral";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative min-h-[280px] w-full rounded-2xl border p-6 text-left transition-all ${
        enabled
          ? `${SURFACE_ACCENTS[type]} ring-1 ring-white/10`
          : "border-slate-700/80 bg-slate-900/30 hover:border-slate-600"
      }`}
    >
      {recommended && (
        <div className="absolute right-4 top-4 flex flex-col items-end gap-1">
          <Badge variant="info">{t("dashboard.launch.surfaceRecommended")}</Badge>
        </div>
      )}
      {!recommended && extraBadges.length > 0 && (
        <div className="absolute right-4 top-4 flex flex-col items-end gap-1">
          {extraBadges.map((key) => (
            <Badge key={key} variant="neutral">
              {t(key)}
            </Badge>
          ))}
        </div>
      )}
      {recommended && extraBadges.length > 0 && (
        <div className="absolute right-4 top-14 flex flex-col items-end gap-1">
          {extraBadges.map((key) => (
            <Badge key={key} variant="neutral">
              {t(key)}
            </Badge>
          ))}
        </div>
      )}
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/80 text-2xl">
        {SURFACE_ICONS[type]}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold text-white">{t(titleKey)}</h3>
        <Badge variant={statusVariant}>{statusLabel}</Badge>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{t(descKey)}</p>
      <p className="mt-3 text-xs text-slate-500">
        <span className="font-medium text-slate-400">{t("dashboard.launch.surfaceLearnMore")}: </span>
        {t(bestForKey)}
      </p>
      {enabled && status === "needs_bot" && (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {t("dashboard.launch.surfaceNeedsBot")}
        </div>
      )}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {enabled ? t("dashboard.launch.surfaceEnabled") : t("dashboard.launch.surfaceDisabled")}
        </span>
        <span
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
            enabled ? "bg-violet-600" : "bg-slate-700"
          }`}
          aria-hidden
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              enabled ? "left-[22px]" : "left-0.5"
            }`}
          />
        </span>
      </div>
    </button>
  );
}
