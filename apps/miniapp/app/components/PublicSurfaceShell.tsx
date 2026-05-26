"use client";

import { useEffect, useMemo, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { resolvePublicSurface, getTenantConfig } from "@astro/api-client";
import { useI18n } from "@astro/i18n";
import { MiniAppRoot, WebsiteLandingScreen } from "@astro/miniapp-renderer";
import { ThemeProvider } from "@astro/theme-engine";
import { LoadingState } from "@astro/ui";
import { localizeTenantConfig, type TenantConfig } from "@astro/tenant-config";

type PublicSurfaceKind = "telegram" | "website" | "mobile";

interface PublicSurfaceShellProps {
  slug: string;
  surfaceKind: PublicSurfaceKind;
}

export function PublicSurfaceShell({ slug, surfaceKind }: PublicSurfaceShellProps) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    resolvePublicSurface(surfaceKind, slug)
      .then(async (surface) => {
        if (surfaceKind === "mobile") {
          if (!cancelled) router.replace(`/${surface.tenantSlug}`);
          return;
        }
        const tenantConfig = await getTenantConfig(surface.tenantSlug, "published");
        if (!cancelled) setConfig(tenantConfig);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug, surfaceKind, router]);

  const localizedConfig = useMemo(
    () => (config ? localizeTenantConfig(config, locale) : null),
    [config, locale]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState message={t("miniapp.shell.loadingApp")} />
      </div>
    );
  }

  if (error || (!localizedConfig && surfaceKind === "website")) notFound();

  if (surfaceKind === "mobile") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState message={t("miniapp.shell.loadingApp")} />
      </div>
    );
  }

  if (surfaceKind === "website" && localizedConfig) {
    return (
      <ThemeProvider config={localizedConfig}>
        <WebsiteLandingScreen config={localizedConfig} slug={slug} />
      </ThemeProvider>
    );
  }

  return null;
}
