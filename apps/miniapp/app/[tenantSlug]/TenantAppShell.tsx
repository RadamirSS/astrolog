"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { getTenantConfig } from "@astro/api-client";
import { useI18n } from "@astro/i18n";
import { MiniAppRoot } from "@astro/miniapp-renderer";
import { ThemeProvider } from "@astro/theme-engine";
import { LoadingState } from "@astro/ui";
import { localizeTenantConfig, type TenantConfig } from "@astro/tenant-config";

interface TenantAppShellProps {
  slug: string;
  children: ReactNode;
}

export function TenantAppShell({ slug, children }: TenantAppShellProps) {
  const { locale, t } = useI18n();
  const searchParams = useSearchParams();
  const previewMode = searchParams.get("preview") === "draft";
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [error, setError] = useState(false);

  const localizedConfig = useMemo(
    () => (config ? localizeTenantConfig(config, locale) : null),
    [config, locale]
  );

  useEffect(() => {
    let cancelled = false;
    setConfig(null);
    setError(false);
    getTenantConfig(slug, previewMode ? "draft" : "published")
      .then((c) => {
        if (!cancelled) setConfig(c);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, previewMode]);

  if (error) notFound();

  if (!localizedConfig) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState message={t("miniapp.shell.loadingApp")} />
      </div>
    );
  }

  return (
    <ThemeProvider config={localizedConfig}>
      <MiniAppRoot config={localizedConfig} previewMode={previewMode}>
        {children}
      </MiniAppRoot>
    </ThemeProvider>
  );
}
