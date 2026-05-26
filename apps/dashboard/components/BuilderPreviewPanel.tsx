"use client";

import type { SurfaceType, TenantConfig } from "@astro/tenant-config";
import { ensureSurfaces, getSurfaceByType, localizeTenantConfig } from "@astro/tenant-config";
import {
  MiniAppRoot,
  MobileWebPreviewBanner,
  WebsiteLandingScreen,
  type MiniAppScreen,
} from "@astro/miniapp-renderer";
import { useI18n, useT } from "@astro/i18n";
import { ThemeProvider } from "@astro/theme-engine";
import { Badge, Button, SegmentedControl } from "@astro/ui";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { previewVerifiedStorageKey } from "../lib/creator-self-service";

interface BuilderPreviewPanelProps {
  config: TenantConfig;
  published?: boolean;
}

const SURFACE_OPTIONS: { value: SurfaceType; labelKey: string; contextKey: string }[] = [
  {
    value: "telegram_mini_app",
    labelKey: "dashboard.preview.surfaceTelegram",
    contextKey: "dashboard.launch.previewTelegramContext",
  },
  {
    value: "website",
    labelKey: "dashboard.preview.surfaceWebsite",
    contextKey: "dashboard.launch.previewWebsiteContext",
  },
  {
    value: "mobile_web",
    labelKey: "dashboard.preview.surfaceMobile",
    contextKey: "dashboard.launch.previewMobileContext",
  },
];

const SCREEN_OPTIONS: { value: MiniAppScreen; labelKey: string }[] = [
  { value: "home", labelKey: "dashboard.preview.screenHome" },
  { value: "products", labelKey: "dashboard.preview.screenProducts" },
  { value: "reports", labelKey: "dashboard.preview.screenReports" },
  { value: "profile", labelKey: "dashboard.launch.previewScreenMenu" },
];

function needsPreviewSession(screen: MiniAppScreen): boolean {
  return screen === "loading" || screen === "report" || screen === "profile" || screen === "reports";
}

function surfaceFromPath(pathname: string): SurfaceType | null {
  if (pathname.includes("/launch/website")) return "website";
  if (pathname.includes("/launch/mobile")) return "mobile_web";
  if (pathname.includes("/launch/telegram")) return "telegram_mini_app";
  return null;
}

function previewStateLabelKey(
  surface: SurfaceType,
  screen: MiniAppScreen,
  productId?: string
): string {
  if (productId || screen === "productDetail") {
    return "dashboard.preview.screenProductDetail";
  }
  if (surface === "website") return "dashboard.preview.screenHome";
  switch (screen) {
    case "products":
      return "dashboard.preview.screenProducts";
    case "reports":
      return "dashboard.preview.screenReports";
    case "profile":
      return "dashboard.launch.previewScreenMenu";
    default:
      return "dashboard.preview.screenHome";
  }
}

export function BuilderPreviewPanel({ config, published = false }: BuilderPreviewPanelProps) {
  const t = useT();
  const { locale } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    config.tenantId ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";

  const miniApp = ensureSurfaces(config.miniApp, config.miniApp?.publicSlug ?? config.slug);
  const enabledSurfaces = (miniApp.surfaces ?? []).filter((s) => s.status !== "disabled");
  const routeSurface = surfaceFromPath(pathname);
  const defaultSurface =
    routeSurface && enabledSurfaces.some((s) => s.type === routeSurface)
      ? routeSurface
      : (enabledSurfaces[0]?.type ?? "website");

  const [surface, setSurface] = useState<SurfaceType>(defaultSurface);
  const [screen, setScreen] = useState<MiniAppScreen>("home");
  const [productId, setProductId] = useState<string | undefined>();
  const [previewVerified, setPreviewVerified] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const nextDefault =
      routeSurface && enabledSurfaces.some((s) => s.type === routeSurface)
        ? routeSurface
        : (enabledSurfaces[0]?.type ?? "website");
    if (!enabledSurfaces.some((s) => s.type === surface)) {
      setSurface(nextDefault);
    }
  }, [enabledSurfaces, surface, routeSurface]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPreviewVerified(window.localStorage.getItem(previewVerifiedStorageKey(tenantId)) === "1");
  }, [tenantId]);

  const localizedConfig = useMemo(
    () => localizeTenantConfig(config, locale),
    [config, locale]
  );

  const activeProducts = localizedConfig.products.filter((p) => p.status === "active");
  const resolvedProductId = productId ?? (screen === "productDetail" ? activeProducts[0]?.id : undefined);
  const showingWebsiteProduct = surface === "website" && Boolean(resolvedProductId);
  const previewScreen = showingWebsiteProduct ? "productDetail" : screen;

  const baseUrl = process.env.NEXT_PUBLIC_MINIAPP_URL ?? "http://localhost:3000";
  const surfacePublicUrl = miniApp.surfaces?.find((s) => s.type === surface)?.publicUrl;
  const publicUrl = surfacePublicUrl
    ? `${baseUrl}${surfacePublicUrl}`
    : `${baseUrl}/s/${miniApp.publicSlug}`;

  const tgSurface = getSurfaceByType(miniApp, "telegram_mini_app");
  const tgConfig = tgSurface?.configJson as { botStatus?: string; botUsername?: string } | undefined;
  const telegramConnected =
    tgConfig?.botStatus === "connected" || tgConfig?.botStatus === "webhook_configured";

  const mobileSurface = getSurfaceByType(miniApp, "mobile_web");
  const mobileConfig = mobileSurface?.configJson as { installableHintEnabled?: boolean } | undefined;

  const surfaceContextKey = SURFACE_OPTIONS.find((o) => o.value === surface)?.contextKey;

  const statusBadge = published
    ? t("dashboard.launch.statusPublished")
    : surface === "telegram_mini_app" && !telegramConnected
      ? t("dashboard.launch.statusNeedsBot")
      : t("dashboard.launch.statusDraft");

  const statusVariant = published
    ? "success"
    : surface === "telegram_mini_app" && !telegramConnected
      ? "warning"
      : "neutral";

  async function copyLink() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1500);
    }
  }

  function openPreview() {
    if (typeof window !== "undefined") {
      window.open(publicUrl, "_blank", "noopener,noreferrer");
    }
  }

  function markPreviewVerified() {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(previewVerifiedStorageKey(tenantId), "1");
    setPreviewVerified(true);
  }

  function clearWebsiteProduct() {
    setProductId(undefined);
    setScreen("home");
  }

  const showMiniAppScreens = surface === "telegram_mini_app" || surface === "mobile_web";
  const surfaceOptions = SURFACE_OPTIONS.filter((opt) =>
    enabledSurfaces.some((s) => s.type === opt.value)
  ).map((opt) => ({ value: opt.value, label: t(opt.labelKey) }));

  const stateLabel = t(previewStateLabelKey(surface, previewScreen, resolvedProductId));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-100">{t("dashboard.preview.livePreview")}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{t("dashboard.launch.previewHelperClient")}</p>
          {surfaceContextKey && (
            <p className="mt-1 text-xs text-violet-300/80">{t(surfaceContextKey)}</p>
          )}
        </div>
        <Badge variant={statusVariant}>{statusBadge}</Badge>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-300">
        <span className="text-slate-500">{t("dashboard.launch.previewStateLabel")}: </span>
        <span className="font-medium text-violet-200">{stateLabel}</span>
      </div>

      {surfaceOptions.length > 1 && (
        <SegmentedControl
          options={surfaceOptions}
          value={surface}
          onChange={(next) => {
            setSurface(next);
            clearWebsiteProduct();
          }}
          className="w-full"
        />
      )}

      {surface === "mobile_web" && (
        <p className="text-xs text-violet-300/90">{t("dashboard.launch.previewMobileBrowserNote")}</p>
      )}

      {showMiniAppScreens && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">{t("dashboard.preview.previewScreen")}</p>
          <SegmentedControl
            size="sm"
            options={SCREEN_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            value={screen}
            onChange={(next) => {
              setScreen(next);
              setProductId(undefined);
            }}
            className="w-full"
          />
        </div>
      )}

      {surface === "telegram_mini_app" && !telegramConnected && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {t("dashboard.launch.previewTelegramNotConnected")}
        </div>
      )}

      {surface === "website" ? (
        <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-inner">
          <div className="flex items-center gap-1.5 border-b border-slate-800 bg-slate-900 px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            <span className="ml-2 truncate text-[10px] text-slate-500">{publicUrl}</span>
          </div>
          <ThemeProvider config={localizedConfig}>
            <div className="relative h-[720px] overflow-y-auto">
              {showingWebsiteProduct ? (
                <div className="absolute inset-0 z-10 flex flex-col bg-slate-950">
                  <div className="border-b border-slate-800 px-3 py-2">
                    <button
                      type="button"
                      onClick={clearWebsiteProduct}
                      className="text-xs text-violet-300 hover:text-violet-200"
                    >
                      {t("dashboard.launch.previewBackToLanding")}
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <MiniAppRoot
                      config={localizedConfig}
                      previewMode
                      initialScreen="productDetail"
                      previewProductId={resolvedProductId}
                      showPreviewNavigation={false}
                      previewSurface="website"
                    />
                  </div>
                </div>
              ) : null}
              <WebsiteLandingScreen
                config={localizedConfig}
                slug={miniApp.publicSlug}
                previewMode
                layout="desktop"
                onPreviewTopic={() => setScreen("onboarding")}
                onPreviewProduct={(id) => {
                  setProductId(id);
                  setScreen("productDetail");
                }}
              />
            </div>
          </ThemeProvider>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[440px] overflow-hidden rounded-[2.25rem] border-[6px] border-slate-600 bg-slate-950 shadow-2xl shadow-black/50 ring-1 ring-white/5">
          {surface === "mobile_web" && (
            <MobileWebPreviewBanner installableHintEnabled={mobileConfig?.installableHintEnabled ?? true} />
          )}
          {surface === "telegram_mini_app" && tgConfig?.botUsername && (
            <div className="border-b border-sky-500/20 bg-sky-950/40 px-3 py-1.5 text-center text-[10px] text-sky-200">
              @{tgConfig.botUsername} · {t("dashboard.launch.previewTelegramContext")}
            </div>
          )}
          <ThemeProvider config={localizedConfig}>
            <div className="h-[720px] overflow-y-auto">
              <MiniAppRoot
                config={localizedConfig}
                previewMode
                initialScreen={previewScreen}
                previewProductId={resolvedProductId}
                seedPreviewSession={needsPreviewSession(previewScreen)}
                showPreviewNavigation
                previewSurface={surface}
                mobileFirst={surface === "mobile_web"}
              />
            </div>
          </ThemeProvider>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={openPreview}>
          {t("dashboard.launch.previewOpen")}
        </Button>
        <Button type="button" variant="secondary" className="flex-1" onClick={() => void copyLink()}>
          {copiedLink ? t("dashboard.controlCenter.copied") : t("dashboard.launch.previewCopyLink")}
        </Button>
      </div>

      <Button
        type="button"
        variant={previewVerified ? "secondary" : "primary"}
        className="w-full"
        onClick={markPreviewVerified}
        disabled={previewVerified}
      >
        {previewVerified ? t("dashboard.launch.previewVerifiedDone") : t("dashboard.launch.previewVerified")}
      </Button>
    </div>
  );
}
