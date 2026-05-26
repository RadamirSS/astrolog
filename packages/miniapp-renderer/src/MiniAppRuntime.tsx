"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getApiMode } from "@astro/api-client";
import { useT } from "@astro/i18n";
import { MockModeBanner } from "@astro/ui";
import { MiniAppProvider } from "./context";
import { hideBottomNav, miniAppPaths } from "./navigation";
import { useMiniApp } from "./context";
import { PaywallScreen } from "./screens/PaywallScreen";
import { MyReportsScreen } from "./screens/MyReportsScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { LoadingScreen } from "./screens/LoadingScreen";
import { ReportScreen } from "./screens/ReportScreen";
import { ProductsScreen } from "./screens/ProductsScreen";
import { ProductDetailScreen } from "./screens/ProductDetailScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { RemoteAuthErrorScreen } from "./RemoteAuthErrorScreen";
import type { MiniAppScreen } from "./types";
import type { SurfaceType } from "@astro/tenant-config";

function NavIcon({ id, active }: { id: "home" | "profile" | "shop"; active: boolean }) {
  const color = active ? "var(--color-primary)" : "var(--color-text-muted)";
  if (id === "home") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9.5z"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (id === "profile") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="8" r="3.5" stroke={color} strokeWidth="1.5" />
        <path
          d="M5 20c0-3.3 3.1-5 7-5s7 1.7 7 5"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6h15l-1.5 9h-12L6 6zM6 6L5 3H2M9 20a1 1 0 102 0 1 1 0 00-2 0zm8 0a1 1 0 102 0 1 1 0 00-2 0z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function screenComponent(screen: MiniAppScreen) {
  switch (screen) {
    case "onboarding":
      return <OnboardingScreen />;
    case "loading":
      return <LoadingScreen />;
    case "report":
      return <ReportScreen />;
    case "paywall":
      return <PaywallScreen />;
    case "products":
      return <ProductsScreen />;
    case "productDetail":
      return <ProductDetailScreen />;
    case "reports":
      return <MyReportsScreen />;
    case "profile":
      return <ProfileScreen />;
    case "home":
    default:
      return <HomeScreen />;
  }
}

interface MiniAppShellProps {
  children: React.ReactNode;
  hideNavigation?: boolean;
  showPreviewNavigation?: boolean;
  previewScreen?: MiniAppScreen;
  onPreviewNavigate?: (screen: MiniAppScreen) => void;
}

export function MiniAppShell({
  children,
  hideNavigation = false,
  showPreviewNavigation = false,
  previewScreen = "home",
  onPreviewNavigate,
}: MiniAppShellProps) {
  const { config, previewMode, authError, authReady, hydrated } = useMiniApp();
  const pathname = usePathname();
  const paths = miniAppPaths(config.slug);
  const t = useT();

  const previewNavActive = previewMode && showPreviewNavigation;
  const showNav =
    !hideNavigation &&
    (previewNavActive || (!previewMode && !authError && !hideBottomNav(pathname, config.slug)));

  if (authReady && authError) {
    return (
      <div className="flex min-h-screen flex-col">
        <MockModeBanner mode={getApiMode()} />
        <RemoteAuthErrorScreen />
      </div>
    );
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-screen flex-col">
        <MockModeBanner mode={getApiMode()} />
        <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-text-muted)]">
          {t("miniapp.shell.loadingApp")}
        </div>
      </div>
    );
  }

  const navItems: {
    href: string;
    id: "home" | "profile" | "shop";
    label: string;
    enabled: boolean;
    screen: MiniAppScreen;
    match: (p: string) => boolean;
  }[] = [
    {
      href: paths.home,
      id: "home",
      label: t("miniapp.nav.home"),
      enabled: true,
      screen: "home",
      match: (p) => p === paths.home,
    },
    {
      href: paths.profile,
      id: "profile",
      label: t("miniapp.nav.profile"),
      enabled: config.modules.profile,
      screen: "profile",
      match: (p) => p === paths.profile,
    },
    {
      href: paths.products,
      id: "shop",
      label: t("miniapp.nav.shop"),
      enabled: config.modules.products,
      screen: "products",
      match: (p) => p === paths.products || p.startsWith(`${paths.products}/`),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <MockModeBanner mode={getApiMode()} />
      {children}
      {showNav && (
        <nav
          className="sticky bottom-0 z-10 flex border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_95%,transparent)] pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
          style={{ boxShadow: "0 -4px 24px color-mix(in srgb, var(--color-border) 40%, transparent)" }}
        >
          {navItems
            .filter((item) => item.enabled)
            .map((item) => {
              const active = previewNavActive
                ? previewScreen === item.screen ||
                  (item.screen === "products" && previewScreen === "productDetail")
                : item.match(pathname);
              if (previewNavActive) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-colors"
                    style={{ color: active ? "var(--color-primary)" : "var(--color-text-muted)" }}
                    onClick={() => onPreviewNavigate?.(item.screen)}
                  >
                    <NavIcon id={item.id} active={active} />
                    <span className={`text-xs ${active ? "font-semibold" : "font-medium"}`}>
                      {item.label}
                    </span>
                  </button>
                );
              }
              return (
                <Link key={item.href} href={item.href} className="flex-1">
                  <button
                    type="button"
                    className="flex w-full min-h-[52px] flex-col items-center justify-center gap-1 py-2.5 transition-colors"
                    style={{ color: active ? "var(--color-primary)" : "var(--color-text-muted)" }}
                  >
                    <NavIcon id={item.id} active={active} />
                    <span className={`text-xs ${active ? "font-semibold" : "font-medium"}`}>
                      {item.label}
                    </span>
                  </button>
                </Link>
              );
            })}
        </nav>
      )}
    </div>
  );
}

export function MiniAppRoot({
  config,
  previewMode,
  initialScreen = "home",
  previewProductId,
  seedPreviewSession,
  showPreviewNavigation = false,
  previewSurface,
  mobileFirst = false,
  children,
}: {
  config: import("@astro/tenant-config").TenantConfig;
  previewMode?: boolean;
  initialScreen?: MiniAppScreen;
  previewProductId?: string;
  seedPreviewSession?: boolean;
  showPreviewNavigation?: boolean;
  previewSurface?: SurfaceType;
  mobileFirst?: boolean;
  children?: React.ReactNode;
}) {
  const [previewScreen, setPreviewScreen] = useState<MiniAppScreen>(initialScreen);
  useEffect(() => {
    if (previewMode) setPreviewScreen(initialScreen);
  }, [previewMode, initialScreen]);
  const handlePreviewNavigate = useCallback((screen: MiniAppScreen) => {
    setPreviewScreen(screen);
  }, []);

  const effectiveScreen = previewMode ? previewScreen : initialScreen;

  return (
    <MiniAppProvider
      config={config}
      previewMode={previewMode}
      previewProductId={previewProductId}
      seedPreviewSession={seedPreviewSession}
    >
      <MiniAppShell
        hideNavigation={false}
        showPreviewNavigation={previewMode && showPreviewNavigation}
        previewScreen={effectiveScreen}
        onPreviewNavigate={handlePreviewNavigate}
      >
        <div
          data-preview-surface={previewSurface}
          data-mobile-first={mobileFirst ? "true" : undefined}
          className={mobileFirst ? "mx-auto w-full max-w-[430px]" : undefined}
        >
          {children ?? screenComponent(effectiveScreen)}
        </div>
      </MiniAppShell>
    </MiniAppProvider>
  );
}

/** @deprecated Use MiniAppRoot with route pages instead */
export function MiniAppRuntime() {
  return null;
}
