"use client";

import type { CSSProperties } from "react";
import type { VisualPack } from "@astro/tenant-config";
import { getVisualPackLabel } from "@astro/tenant-config";
import { visualPackToCssVariables, getVisualPackClassName } from "@astro/theme-engine";
import { useI18n, useT } from "@astro/i18n";

const PACK_USE_KEYS: Record<Exclude<VisualPack, "brand_default">, string> = {
  sky_clarity: "dashboard.launch.visualPackSkyClarity",
  dark_gold_mystic: "dashboard.launch.visualPackDarkGold",
  pink_love: "dashboard.launch.visualPackPinkLove",
  cosmic_pastel: "dashboard.launch.visualPackCosmicPastel",
};

interface VisualPackCardProps {
  pack: VisualPack;
  selected?: boolean;
  onSelect?: () => void;
}

export function VisualPackCard({ pack, selected, onSelect }: VisualPackCardProps) {
  const t = useT();
  const { locale } = useI18n();
  if (pack === "brand_default") return null;

  const useKey = PACK_USE_KEYS[pack as keyof typeof PACK_USE_KEYS];
  const label = getVisualPackLabel(pack, locale === "ru" ? "ru" : "en");
  const cssVars = visualPackToCssVariables(pack);
  const style = Object.fromEntries(
    Object.entries(cssVars).map(([k, v]) => [k, v])
  ) as CSSProperties;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`overflow-hidden rounded-2xl border text-left transition-all ${
        selected
          ? "border-violet-500 ring-2 ring-violet-500/50 shadow-lg shadow-violet-500/10"
          : "border-slate-700 hover:border-slate-500 hover:shadow-md"
      }`}
    >
      <div
        className={`relative h-36 ${getVisualPackClassName(pack)}`}
        style={{ ...style, background: cssVars["--vp-gradient"] }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span className="absolute bottom-3 left-3 text-base font-semibold text-white">{label}</span>
        {selected && (
          <span className="absolute right-3 top-3 rounded-full bg-violet-600 px-2 py-0.5 text-xs text-white">
            ✓
          </span>
        )}
      </div>
      <div className="space-y-2 bg-slate-900/80 p-4">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-slate-400">
          <span className="font-medium text-slate-300">{t("dashboard.launch.visualPackRecommended")}: </span>
          {t(useKey)}
        </p>
      </div>
    </button>
  );
}
