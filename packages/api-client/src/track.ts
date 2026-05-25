import type { AnalyticsEventName } from "@astro/api-contracts";
import { trackEvent } from "./client";

export async function trackSafe(
  tenantId: string,
  name: AnalyticsEventName,
  payload?: Record<string, unknown>
): Promise<void> {
  try {
    await trackEvent(tenantId, name, payload);
  } catch {
    /* never break UI */
  }
}

export function trackSafeSync(
  tenantId: string,
  name: AnalyticsEventName,
  payload?: Record<string, unknown>
): void {
  void trackSafe(tenantId, name, payload);
}
