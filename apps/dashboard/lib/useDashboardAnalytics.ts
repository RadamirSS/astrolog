"use client";

import { useCallback } from "react";
import { trackSafeSync } from "@astro/api-client";
import type { AnalyticsEventName } from "@astro/api-client";

export function useDashboardAnalytics(tenantId: string, tenantSlug?: string) {
  return useCallback(
    (eventName: AnalyticsEventName, properties?: Record<string, unknown>) => {
      trackSafeSync(tenantId, eventName, {
        tenantSlug,
        ...properties,
      });
    },
    [tenantId, tenantSlug]
  );
}
