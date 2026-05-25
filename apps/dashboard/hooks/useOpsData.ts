"use client";

import { useCallback, useEffect, useState } from "react";

export function useOpsQuery<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}

export function useTenantIdFromSearch(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ?? "tenant_mystic";
  }
  const params = new URLSearchParams(window.location.search);
  return params.get("tenantId") ?? process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ?? "tenant_mystic";
}
