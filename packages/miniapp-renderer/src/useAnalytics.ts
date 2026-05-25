"use client";

import { useEffect, useRef } from "react";
import { trackSafeSync } from "@astro/api-client";
import type { AnalyticsEventName } from "@astro/api-client";
import { attributionAnalyticsProps, getAttribution } from "./attribution";
import { useMiniApp } from "./context";

export function useTrackOnce(
  eventName: AnalyticsEventName,
  properties?: Record<string, unknown>
) {
  const { config, userId } = useMiniApp();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackSafeSync(config.tenantId, eventName, {
      tenantSlug: config.slug,
      userId,
      ...attributionAnalyticsProps(getAttribution()),
      ...properties,
    });
  }, [config.tenantId, config.slug, eventName, userId, properties]);
}

export function useMiniAppAnalytics() {
  const { config, userId } = useMiniApp();

  return {
    track: (eventName: AnalyticsEventName, properties?: Record<string, unknown>) =>
      trackSafeSync(config.tenantId, eventName, {
        tenantSlug: config.slug,
        userId,
        ...attributionAnalyticsProps(getAttribution()),
        ...properties,
      }),
  };
}
