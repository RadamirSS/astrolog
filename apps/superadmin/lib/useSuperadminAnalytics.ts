"use client";

import { useEffect } from "react";
import { trackSafeSync } from "@astro/api-client";
import type { AnalyticsEventName } from "@astro/api-client";

export function useSuperadminAnalytics() {
  useEffect(() => {
    trackSafeSync("platform", "superadmin_opened");
  }, []);

  return (eventName: AnalyticsEventName, properties?: Record<string, unknown>) => {
    trackSafeSync("platform", eventName, properties);
  };
}
