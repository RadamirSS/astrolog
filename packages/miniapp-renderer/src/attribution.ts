import type { FunnelTopic } from "@astro/tenant-config";

export interface PartnerAttribution {
  partnerId?: string;
  partnerSlug?: string;
  campaignId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  clickId?: string;
  firstTouchAt?: string;
  lastTouchAt?: string;
}

export const ATTRIBUTION_STORAGE_KEY = "astro_partner_attribution";

function generateClickId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `click_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function parseAttributionParams(
  searchParams: URLSearchParams | Record<string, string | undefined>
): Partial<PartnerAttribution> {
  const get = (key: string) => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) ?? undefined;
    }
    return searchParams[key];
  };
  return {
    campaignId: get("campaignId") ?? get("campaign_id"),
    utmSource: get("utm_source"),
    utmMedium: get("utm_medium"),
    utmCampaign: get("utm_campaign"),
  };
}

export function capturePartnerEntry(
  partnerSlug: string,
  options?: {
    partnerId?: string;
    topic?: FunnelTopic;
    params?: URLSearchParams | Record<string, string | undefined>;
  }
): PartnerAttribution {
  const now = new Date().toISOString();
  const existing = getAttribution();
  const parsed = options?.params ? parseAttributionParams(options.params) : {};

  const attribution: PartnerAttribution = {
    partnerSlug,
    partnerId: options?.partnerId ?? existing?.partnerId,
    campaignId: parsed.campaignId ?? existing?.campaignId,
    utmSource: parsed.utmSource ?? existing?.utmSource,
    utmMedium: parsed.utmMedium ?? existing?.utmMedium,
    utmCampaign: parsed.utmCampaign ?? existing?.utmCampaign,
    clickId: generateClickId(),
    firstTouchAt: existing?.firstTouchAt ?? now,
    lastTouchAt: now,
  };

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
    } catch {
      /* ignore */
    }
  }

  return attribution;
}

export function getAttribution(): PartnerAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PartnerAttribution;
  } catch {
    return null;
  }
}

export function serializePartnerAttribution(attribution: PartnerAttribution | null): string | undefined {
  if (!attribution?.partnerSlug) return undefined;
  return JSON.stringify(attribution);
}

export function attributionAnalyticsProps(
  attribution: PartnerAttribution | null
): Record<string, unknown> {
  if (!attribution) return {};
  return {
    partnerSlug: attribution.partnerSlug,
    partnerId: attribution.partnerId,
    campaignId: attribution.campaignId,
    utmSource: attribution.utmSource,
    utmMedium: attribution.utmMedium,
    utmCampaign: attribution.utmCampaign,
    clickId: attribution.clickId,
  };
}

export const PARTNER_TOPIC_SLUGS: Record<string, FunnelTopic> = {
  money: "money",
  relationships: "relationships",
  personality: "personality",
};

export function parsePartnerTopicSlug(slug: string): FunnelTopic | null {
  return PARTNER_TOPIC_SLUGS[slug] ?? null;
}
