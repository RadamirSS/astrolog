"use client";

import { useT } from "@astro/i18n";
import { Badge } from "./Badge";

interface MockModeBannerProps {
  mode?: string;
}

export function MockModeBanner({ mode = "mock" }: MockModeBannerProps) {
  const t = useT();

  if (mode !== "mock") return null;

  return (
    <div className="border-b border-amber-800/50 bg-amber-950/40 px-4 py-2 text-center text-sm text-amber-200">
      <Badge variant="warning">{t("ui.mockBadge")}</Badge>
      <span className="ml-2">{t("ui.mockMessage")}</span>
    </div>
  );
}
