"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ConfigChangedArea, DashboardStats, TenantConfig, TenantConfigStatus } from "@astro/tenant-config";
import { cloneTenantConfig } from "@astro/tenant-config";
import {
  discardDraftConfig,
  getConfigStatus,
  getDashboardStats,
  getDraftConfig,
  getPublishedConfig,
  restoreDraftFromPublished,
  saveDraftConfig,
} from "@astro/api-client";
import {
  clearStoredDraft,
  isStoredDraftNewer,
  loadStoredDraft,
  saveStoredDraft,
} from "../lib/draft-storage";

function configsEqual(a: TenantConfig | null, b: TenantConfig | null): boolean {
  if (!a || !b) return a === b;
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useDraftConfig(tenantId: string) {
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [savedConfig, setSavedConfig] = useState<TenantConfig | null>(null);
  const [publishedConfig, setPublishedConfig] = useState<TenantConfig | null>(null);
  const [configStatus, setConfigStatus] = useState<TenantConfigStatus | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingConfigRef = useRef<TenantConfig | null>(null);

  const isDirty = !configsEqual(config, savedConfig);
  const hasUnpublishedChanges = configStatus?.hasUnpublishedChanges ?? false;
  const changedAreas: ConfigChangedArea[] = configStatus?.changedAreas ?? [];

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [draft, published, status, dashboardStats] = await Promise.all([
        getDraftConfig(tenantId),
        getPublishedConfig(tenantId),
        getConfigStatus(tenantId),
        getDashboardStats(tenantId),
      ]);
      const stored = loadStoredDraft(tenantId);
      const useStored = isStoredDraftNewer(stored, draft.meta?.updatedAt);
      const activeConfig = useStored && stored ? stored.config : draft;

      setConfig(activeConfig);
      setSavedConfig(cloneTenantConfig(draft));
      setPublishedConfig(published);
      setConfigStatus(status);
      setStats(dashboardStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const flushSave = useCallback(
    async (next: TenantConfig) => {
      setSaving(true);
      setError(null);
      try {
        const saved = await saveDraftConfig(tenantId, next);
        setConfig(saved);
        setSavedConfig(cloneTenantConfig(saved));
        saveStoredDraft(tenantId, saved);
        const status = await getConfigStatus(tenantId);
        setConfigStatus(status);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      } finally {
        setSaving(false);
        pendingConfigRef.current = null;
      }
    },
    [tenantId]
  );

  const scheduleSave = useCallback(
    (next: TenantConfig) => {
      pendingConfigRef.current = next;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (pendingConfigRef.current) {
          void flushSave(pendingConfigRef.current);
        }
      }, 300);
    },
    [flushSave]
  );

  const updateDraft = useCallback(
    (updater: (prev: TenantConfig) => TenantConfig, options?: { immediate?: boolean }) => {
      setConfig((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        saveStoredDraft(tenantId, next);
        if (options?.immediate) {
          void flushSave(next);
        } else {
          scheduleSave(next);
        }
        return next;
      });
    },
    [tenantId, flushSave, scheduleSave]
  );

  const saveDraft = useCallback(async () => {
    if (!config) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await flushSave(config);
  }, [config, flushSave]);

  const discardDraft = useCallback(async () => {
    clearStoredDraft(tenantId);
    await refresh();
  }, [tenantId, refresh]);

  const discardServerDraft = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await discardDraftConfig(tenantId);
      clearStoredDraft(tenantId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to discard draft");
    } finally {
      setSaving(false);
    }
  }, [tenantId, refresh]);

  const restoreFromPublished = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await restoreDraftFromPublished(tenantId);
      clearStoredDraft(tenantId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore from published");
    } finally {
      setSaving(false);
    }
  }, [tenantId, refresh]);

  const resetToSaved = useCallback(() => {
    if (savedConfig) {
      setConfig(cloneTenantConfig(savedConfig));
      clearStoredDraft(tenantId);
    }
  }, [savedConfig, tenantId]);

  return {
    config,
    savedConfig,
    publishedConfig,
    configStatus,
    stats,
    loading,
    saving,
    error,
    isDirty,
    hasUnpublishedChanges,
    changedAreas,
    draftUpdatedAt: configStatus?.draftUpdatedAt,
    lastPublishedAt: configStatus?.lastPublishedAt ?? stats?.lastPublishedAt,
    refresh,
    updateDraft,
    saveDraft,
    discardDraft,
    discardServerDraft,
    restoreFromPublished,
    resetToSaved,
    setLocalConfig: setConfig,
  };
}
