"use client";

import { createContext, useContext, type ReactNode } from "react";
import type {
  ConfigChangedArea,
  DashboardStats,
  TenantConfig,
  TenantConfigStatus,
} from "@astro/tenant-config";
import { useDraftConfig } from "../../hooks/useDraftConfig";

interface DashboardContextValue {
  tenantId: string;
  config: TenantConfig | null;
  savedConfig: TenantConfig | null;
  publishedConfig: TenantConfig | null;
  configStatus: TenantConfigStatus | null;
  stats: DashboardStats | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  isDirty: boolean;
  hasUnpublishedChanges: boolean;
  changedAreas: ConfigChangedArea[];
  draftUpdatedAt?: string;
  lastPublishedAt?: string;
  refresh: () => Promise<void>;
  updateConfig: (
    updater: (prev: TenantConfig) => TenantConfig,
    options?: { immediate?: boolean }
  ) => void;
  saveDraft: () => Promise<void>;
  discardDraft: () => Promise<void>;
  discardServerDraft: () => Promise<void>;
  restoreFromPublished: () => Promise<void>;
  resetToSaved: () => void;
  setLocalConfig: (config: TenantConfig) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  tenantId,
  children,
}: {
  tenantId: string;
  children: ReactNode;
}) {
  const draft = useDraftConfig(tenantId);

  return (
    <DashboardContext.Provider value={{ tenantId, ...draft, updateConfig: draft.updateDraft }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}
