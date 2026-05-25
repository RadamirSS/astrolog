"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ApiClientError,
  getApiMode,
  getBirthProfile,
  getUserEntitlements,
  validateTelegramInitData,
} from "@astro/api-client";
import { trackSafeSync } from "@astro/api-client";
import { getTelegramInitData } from "@astro/telegram";
import type { AnyReport, BirthProfile, FunnelTopic, ReportLibraryItem } from "@astro/tenant-config";
import {
  createDemoReportLibrary,
  createMockReportLibrary,
  createPilotReportLibrary,
  syncReportLibraryWithEntitlements,
  syncReportLibraryWithSession,
} from "@astro/tenant-config";
import {
  createPreviewSession,
  loadSession,
  saveSession,
  type SessionData,
} from "./session";
import { miniAppPaths, sessionStorageKey } from "./navigation";

interface MiniAppContextValue {
  config: import("@astro/tenant-config").TenantConfig;
  userId: string;
  birthProfile: BirthProfile | null;
  setBirthProfile: (profile: BirthProfile | null) => void;
  selectedTopic: FunnelTopic | null;
  setSelectedTopic: (topic: FunnelTopic | null) => void;
  report: AnyReport | null;
  setReport: (report: AnyReport | null) => void;
  reportLibrary: ReportLibraryItem[];
  setReportLibrary: (items: ReportLibraryItem[]) => void;
  previewMode: boolean;
  hydrated: boolean;
  productId: string | null;
  authReady: boolean;
  authError: string | null;
}

const MiniAppContext = createContext<MiniAppContextValue | null>(null);

interface MiniAppProviderProps {
  config: import("@astro/tenant-config").TenantConfig;
  previewMode?: boolean;
  previewProductId?: string;
  seedPreviewSession?: boolean;
  children: ReactNode;
}

function defaultMockUserId(config: import("@astro/tenant-config").TenantConfig, previewMode: boolean) {
  return `user_${config.tenantId}_${previewMode ? "preview" : "session"}`;
}

function baseReportLibrary(
  config: import("@astro/tenant-config").TenantConfig,
  previewMode: boolean
) {
  if (getApiMode() === "remote" && !previewMode) {
    return createPilotReportLibrary(config.slug, "ru");
  }
  if (process.env.NEXT_PUBLIC_DEMO_REPORTS === "true") {
    return createDemoReportLibrary(config.slug, "ru");
  }
  return createMockReportLibrary(config.slug, "ru");
}

function seedLibraryIfEmpty(
  config: import("@astro/tenant-config").TenantConfig,
  library: ReportLibraryItem[],
  report: AnyReport | null,
  previewMode: boolean
): ReportLibraryItem[] {
  const base = library.length > 0 ? library : baseReportLibrary(config, previewMode);
  return syncReportLibraryWithSession(base, {
    tenantSlug: config.slug,
    locale: "ru",
    report,
  });
}

export function MiniAppProvider({
  config,
  previewMode = false,
  previewProductId,
  seedPreviewSession = false,
  children,
}: MiniAppProviderProps) {
  const isRemote = getApiMode() === "remote";
  const [userId, setUserId] = useState(() =>
    previewMode || !isRemote ? defaultMockUserId(config, previewMode) : ""
  );
  const [authReady, setAuthReady] = useState(!isRemote || previewMode);
  const [authError, setAuthError] = useState<string | null>(null);
  const storageKey = useMemo(
    () => (userId ? sessionStorageKey(config.tenantId, userId) : ""),
    [config.tenantId, userId]
  );

  const [session, setSession] = useState<SessionData>({
    birthProfile: null,
    report: null,
    selectedTopic: null,
    reportLibrary: [],
  });
  const [hydrated, setHydrated] = useState(false);

  const patchSession = useCallback(
    (patch: Partial<SessionData>) => {
      if (!storageKey) return;
      setSession((prev) => {
        const next = { ...prev, ...patch };
        saveSession(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  const setBirthProfile = useCallback(
    (profile: BirthProfile | null) => patchSession({ birthProfile: profile }),
    [patchSession]
  );

  const setSelectedTopic = useCallback(
    (topic: FunnelTopic | null) => patchSession({ selectedTopic: topic }),
    [patchSession]
  );

  const setReport = useCallback(
    (report: AnyReport | null) => {
      setSession((prev) => {
        const library =
          prev.reportLibrary.length > 0
            ? prev.reportLibrary
            : baseReportLibrary(config, previewMode);
        const reportLibrary = syncReportLibraryWithSession(library, {
          tenantSlug: config.slug,
          locale: "ru",
          report,
        });
        const next = { ...prev, report, reportLibrary };
        if (storageKey) saveSession(storageKey, next);
        return next;
      });
    },
    [config.slug, storageKey]
  );

  const setReportLibrary = useCallback(
    (reportLibrary: ReportLibraryItem[]) => patchSession({ reportLibrary }),
    [patchSession]
  );

  useEffect(() => {
    if (!userId || authError) return;
    trackSafeSync(config.tenantId, "miniapp_opened", {
      tenantSlug: config.slug,
      userId,
      previewMode,
    });
  }, [config.tenantId, config.slug, userId, previewMode, authError]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrapRemoteAuth() {
      if (previewMode || !isRemote) {
        setAuthReady(true);
        return;
      }
      try {
        const initData = getTelegramInitData();
        const user = await validateTelegramInitData(config.slug, initData);
        if (!cancelled) {
          setUserId(user.id);
          setAuthError(null);
          setAuthReady(true);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof ApiClientError
              ? error.message
              : "Telegram authentication failed. Open this app from Telegram to continue.";
          setAuthError(message);
          setUserId("");
          setAuthReady(true);
        }
      }
    }

    void bootstrapRemoteAuth();
    return () => {
      cancelled = true;
    };
  }, [config.slug, isRemote, previewMode]);

  useEffect(() => {
    if (!authReady) return;

    if (authError) {
      setHydrated(true);
      return;
    }

    if (!userId) return;

    let cancelled = false;
    async function hydrate() {
      if (previewMode && seedPreviewSession) {
        const previewSession = createPreviewSession(config);
        setSession(previewSession);
        saveSession(sessionStorageKey(config.tenantId, userId), previewSession);
        if (!cancelled) setHydrated(true);
        return;
      }

      const key = sessionStorageKey(config.tenantId, userId);
      const cached = loadSession(key);
      const library = seedLibraryIfEmpty(config, cached.reportLibrary, cached.report, previewMode);
      const merged = { ...cached, reportLibrary: library };
      if (cached.birthProfile || cached.report || cached.selectedTopic || library.length) {
        setSession(merged);
        if (library !== cached.reportLibrary) saveSession(key, merged);
      }

      try {
        const profile = await getBirthProfile(config.tenantId, userId);
        if (!cancelled && profile) {
          patchSession({ birthProfile: profile });
        }
        const entitlements = await getUserEntitlements({
          tenantId: config.tenantId,
        });
        if (!cancelled) {
          const current = loadSession(key);
          const library = syncReportLibraryWithEntitlements(
            current.reportLibrary.length > 0
              ? current.reportLibrary
              : baseReportLibrary(config, previewMode),
            {
              tenantSlug: config.slug,
              locale: "ru",
              report: current.report,
              entitlements,
            }
          );
          patchSession({ reportLibrary: library });
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, [config, previewMode, seedPreviewSession, userId, authReady, isRemote, authError, patchSession]);

  const pathname = usePathname();
  const productIdMatch = pathname.match(new RegExp(`^/${config.slug}/products/([^/]+)$`));
  const productId = previewProductId ?? productIdMatch?.[1] ?? null;

  const value = useMemo(
    () => ({
      config,
      userId,
      birthProfile: session.birthProfile,
      setBirthProfile,
      selectedTopic: session.selectedTopic,
      setSelectedTopic,
      report: session.report,
      setReport,
      reportLibrary: session.reportLibrary,
      setReportLibrary,
      previewMode,
      hydrated: hydrated && authReady,
      productId,
      authReady,
      authError,
    }),
    [
      config,
      userId,
      session.birthProfile,
      session.selectedTopic,
      session.report,
      session.reportLibrary,
      setBirthProfile,
      setSelectedTopic,
      setReport,
      setReportLibrary,
      previewMode,
      hydrated,
      authReady,
      productId,
      authError,
    ]
  );

  return <MiniAppContext.Provider value={value}>{children}</MiniAppContext.Provider>;
}

export function useMiniApp() {
  const ctx = useContext(MiniAppContext);
  if (!ctx) throw new Error("useMiniApp must be used within MiniAppProvider");
  return ctx;
}

export function useMiniAppNav() {
  const router = useRouter();
  const { config } = useMiniApp();
  const paths = miniAppPaths(config.slug);

  return {
    paths,
    goHome: () => router.push(paths.home),
    goOnboarding: (topic?: string) =>
      router.push(topic ? `${paths.onboarding}?topic=${topic}` : paths.onboarding),
    goLoading: () => router.push(paths.loading),
    goReport: () => router.push(paths.report),
    goPaidReport: (reportId: string) => router.push(paths.paidReport(reportId)),
    goPaywall: () => router.push(paths.paywall),
    goProducts: () => router.push(paths.products),
    goProductDetail: (id: string) => router.push(paths.productDetail(id)),
    goReports: () => router.push(paths.reports),
    goProfile: () => router.push(paths.profile),
    goPremiumRequest: (productId?: string) => router.push(paths.premiumRequest(productId)),
    goPremiumStatus: (requestId: string) => router.push(paths.premiumStatus(requestId)),
  };
}
