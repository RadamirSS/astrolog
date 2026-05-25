"use client";

import { useEffect, useState } from "react";
import { getApiMode, getDashboardMetrics } from "@astro/api-client";
import type { DashboardMetrics } from "@astro/api-client";

export function useDashboardMetrics(tenantId: string, period: "7d" | "30d" = "7d") {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const isMock = getApiMode() === "mock";

  useEffect(() => {
    if (isMock || !tenantId) {
      setMetrics(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getDashboardMetrics(tenantId, period)
      .then((data) => {
        if (!cancelled) setMetrics(data);
      })
      .catch(() => {
        if (!cancelled) setMetrics(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, period, isMock]);

  return { metrics, loading, isMock };
}
