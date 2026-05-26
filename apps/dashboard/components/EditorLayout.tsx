"use client";

import type { ReactNode } from "react";
import type { TenantConfig } from "@astro/tenant-config";
import { useT } from "@astro/i18n";
import { BuilderPreviewPanel } from "./BuilderPreviewPanel";
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
  title,
}: EditorLayoutProps) {
  const t = useT();
  const previewTitle = title ?? t("dashboard.preview.livePreview");

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0 space-y-6">{children}</div>
      <aside className="hidden xl:block xl:sticky xl:top-8 xl:self-start">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <h3 className="mb-4 text-sm font-medium text-slate-300">{previewTitle}</h3>
          <BuilderPreviewPanel config={config} />
        </div>
      </aside>
    </div>
  );
}
