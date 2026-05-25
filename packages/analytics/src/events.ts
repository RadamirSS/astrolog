import type { AnalyticsEvent } from "@astro/tenant-config";
import type { AnalyticsEventName, AnalyticsEventPayload } from "@astro/api-contracts";

export type AnalyticsEventInput = Omit<AnalyticsEvent, "id" | "timestamp">;

export function createAnalyticsEvent(input: AnalyticsEventInput): AnalyticsEvent {
  return {
    ...input,
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };
}

export function createTypedAnalyticsEvent(
  eventName: AnalyticsEventName,
  input: Omit<AnalyticsEventPayload, "eventName" | "timestamp"> & {
    tenantId: string;
  }
): AnalyticsEvent {
  return createAnalyticsEvent({
    tenantId: input.tenantId,
    name: eventName,
    payload: {
      tenantSlug: input.tenantSlug,
      userId: input.userId,
      sessionId: input.sessionId,
      ...input.properties,
    },
  });
}

export class MockAnalyticsClient {
  private events: AnalyticsEvent[] = [];
  private debug: boolean;

  constructor(options?: { debug?: boolean }) {
    this.debug = options?.debug ?? false;
  }

  track(event: AnalyticsEventInput): AnalyticsEvent {
    const stored = createAnalyticsEvent(event);
    this.events.push(stored);
    if (this.debug) {
      console.debug("[analytics:mock]", stored.name, stored.payload);
    }
    return stored;
  }

  trackTyped(
    eventName: AnalyticsEventName,
    input: Omit<AnalyticsEventPayload, "eventName" | "timestamp"> & { tenantId: string }
  ): AnalyticsEvent {
    return this.track({
      tenantId: input.tenantId,
      name: eventName,
      payload: {
        tenantSlug: input.tenantSlug,
        userId: input.userId,
        sessionId: input.sessionId,
        ...input.properties,
      },
    });
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
  }
}

export const mockAnalyticsClient = new MockAnalyticsClient();

export type { AnalyticsEventName, AnalyticsEventPayload } from "@astro/api-contracts";
export {
  ANALYTICS_EVENT_NAMES,
  DASHBOARD_ANALYTICS_EVENTS,
  MINIAPP_ANALYTICS_EVENTS,
  SUPERADMIN_ANALYTICS_EVENTS,
} from "@astro/api-contracts";
