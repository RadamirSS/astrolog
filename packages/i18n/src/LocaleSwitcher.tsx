"use client";

import { useI18n } from "./context";
import type { AppLocale } from "./core";

export interface LocaleSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function LocaleSwitcher({ className = "", compact = true }: LocaleSwitcherProps) {
  const { locale, setLocale, t } = useI18n();

  const base =
    "inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/80 text-xs font-medium";
  const btn = (active: boolean) =>
    `${compact ? "px-2 py-1" : "px-3 py-1.5"} transition-colors ${
      active ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
    }`;

  const toggle = (next: AppLocale) => {
    if (next !== locale) setLocale(next);
  };

  return (
    <div
      className={`${base} ${className}`}
      role="group"
      aria-label={t("common.switchLocale")}
    >
      <button type="button" className={btn(locale === "en")} onClick={() => toggle("en")}>
        {t("common.localeEn")}
      </button>
      <button type="button" className={btn(locale === "ru")} onClick={() => toggle("ru")}>
        {t("common.localeRu")}
      </button>
    </div>
  );
}
