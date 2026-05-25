import type { TenantConfig } from "@astro/tenant-config";

const STORAGE_PREFIX = "dashboard_draft_";

export interface StoredDraft {
  config: TenantConfig;
  savedAt: string;
}

export function getDraftStorageKey(tenantId: string): string {
  return `${STORAGE_PREFIX}${tenantId}`;
}

export function loadStoredDraft(tenantId: string): StoredDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getDraftStorageKey(tenantId));
    if (!raw) return null;
    return JSON.parse(raw) as StoredDraft;
  } catch {
    return null;
  }
}

export function saveStoredDraft(tenantId: string, config: TenantConfig): void {
  if (typeof window === "undefined") return;
  const payload: StoredDraft = {
    config,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(getDraftStorageKey(tenantId), JSON.stringify(payload));
}

export function clearStoredDraft(tenantId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getDraftStorageKey(tenantId));
}

export function isStoredDraftNewer(
  stored: StoredDraft | null,
  apiUpdatedAt?: string
): boolean {
  if (!stored) return false;
  if (!apiUpdatedAt) return true;
  return new Date(stored.savedAt).getTime() > new Date(apiUpdatedAt).getTime();
}
