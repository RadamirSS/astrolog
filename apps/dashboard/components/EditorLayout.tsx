"use client";

import type { ReactNode } from "react";
import type { TenantConfig } from "@astro/tenant-config";
import { useT } from "@astro/i18n";
import { CompactPreview } from "./CompactPreview";
import type { MiniAppScreen } from "@astro/miniapp-renderer";

interface EditorLayoutProps {
  config: TenantConfig;
  children: ReactNode;
  previewScreen?: MiniAppScreen;
  title?: string;
}

export function EditorLayout({
  config,
  children,
  previewScreen = "home",
  title,
}: EditorLayoutProps) {
  const t = useT();
  const previewTitle = title ?? t("dashboard.preview.livePreview");

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-6">{children}</div>
      <aside className="xl:sticky xl:top-8 xl:self-start">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h3 className="mb-4 text-sm font-medium text-slate-300">{previewTitle}</h3>
          <CompactPreview config={config} screen={previewScreen} />
        </div>
      </aside>
    </div>
  );
}
