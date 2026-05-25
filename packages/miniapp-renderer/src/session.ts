import type { FunnelTopic, AnyReport, ReportLibraryItem, BirthProfile } from "@astro/tenant-config";
import type { PartnerAttribution } from "./attribution";
import {
  buildMockFreeReportV2,
  createMockReportLibrary,
  syncReportLibraryWithSession,
  type TenantConfig,
} from "@astro/tenant-config";
import { miniAppPaths, sessionStorageKey } from "./navigation";

export interface SessionData {
  birthProfile: BirthProfile | null;
  report: AnyReport | null;
  selectedTopic: FunnelTopic | null;
  reportLibrary: ReportLibraryItem[];
  attribution?: PartnerAttribution | null;
}

interface MiniAppContextValue {
  config: TenantConfig;
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

export function loadSession(key: string): SessionData {
  if (typeof window === "undefined") {
    return { birthProfile: null, report: null, selectedTopic: null, reportLibrary: [], attribution: null };
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return { birthProfile: null, report: null, selectedTopic: null, reportLibrary: [], attribution: null };
    }
    const parsed = JSON.parse(raw) as Partial<SessionData>;
    return {
      birthProfile: parsed.birthProfile ?? null,
      report: parsed.report ?? null,
      selectedTopic: parsed.selectedTopic ?? null,
      reportLibrary: parsed.reportLibrary ?? [],
      attribution: parsed.attribution ?? null,
    };
  } catch {
    return { birthProfile: null, report: null, selectedTopic: null, reportLibrary: [], attribution: null };
  }
}

export function saveSession(key: string, data: SessionData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* ignore quota errors */
  }
}

export function createPreviewSession(config: TenantConfig): SessionData {
  const now = new Date().toISOString();
  const report = buildMockFreeReportV2({
    tenantId: config.tenantId,
    birthProfile: {
      name: "Preview User",
      birthDate: "1990-06-15",
      birthTime: "14:30",
      timeAccuracy: "exact",
      topic: "personality",
    },
    theme: "personality",
    locale: "ru",
    products: config.products,
  });
  return {
    birthProfile: {
      userId: `preview_${config.tenantId}`,
      tenantId: config.tenantId,
      name: "Preview User",
      birthDate: "1990-06-15",
      birthTime: "14:30",
      timeAccuracy: "exact",
      birthPlace: "Moscow, Russia",
      topic: "personality",
      createdAt: now,
    },
    report,
    selectedTopic: "personality",
    reportLibrary: syncReportLibraryWithSession(createMockReportLibrary(config.slug, "ru"), {
      tenantSlug: config.slug,
      locale: "ru",
      report,
    }),
  };
}

export type { MiniAppContextValue };
