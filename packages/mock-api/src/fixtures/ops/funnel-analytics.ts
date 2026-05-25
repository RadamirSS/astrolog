import type { FunnelAnalyticsSummary, FunnelStage } from "@astro/api-contracts";

const STAGES: FunnelStage[] = [
  "landing_viewed",
  "topic_selected",
  "birth_form_completed",
  "free_report_viewed",
  "paywall_viewed",
  "product_viewed",
  "checkout_started",
  "payment_paid",
  "paid_report_ready",
];

const BASE_COUNTS = [5200, 4100, 3200, 2800, 2100, 980, 420, 180, 165];

function buildStages(counts: number[]) {
  const first = counts[0] ?? 1;
  return STAGES.map((stage, i) => ({
    stage,
    count: counts[i] ?? 0,
    conversionFromPrevious: i === 0 ? undefined : (counts[i] ?? 0) / (counts[i - 1] || 1),
    conversionFromFirst: (counts[i] ?? 0) / first,
  }));
}

function buildBreakdown(
  items: Array<{ key: string; label: string; multiplier: number }>
) {
  return items.map(({ key, label, multiplier }) => ({
    key,
    label,
    stages: buildStages(BASE_COUNTS.map((c) => Math.round(c * multiplier))),
  }));
}

export function getFunnelAnalyticsForTenant(tenantId: string): FunnelAnalyticsSummary {
  const multiplier = tenantId === "tenant_mystic" ? 1 : tenantId === "tenant_soft" ? 0.35 : 0.2;
  const counts = BASE_COUNTS.map((c) => Math.round(c * multiplier));
  return {
    stages: buildStages(counts),
    byPartner: buildBreakdown([
      { key: "nicole", label: "Nicole Astrology", multiplier: 0.45 * multiplier },
      { key: "luna-guide", label: "Luna Guide", multiplier: 0.3 * multiplier },
      { key: "astro-mira", label: "Astro Mira", multiplier: 0.15 * multiplier },
      { key: "direct", label: "Direct / Organic", multiplier: 0.1 * multiplier },
    ]),
    byProduct: buildBreakdown([
      { key: "low_ticket_money", label: "Денежный код", multiplier: 0.28 * multiplier },
      { key: "low_ticket_relationships", label: "Код отношений", multiplier: 0.32 * multiplier },
      { key: "low_ticket_personality", label: "Личностный портрет", multiplier: 0.18 * multiplier },
      { key: "main_natal_portrait", label: "Полный портрет", multiplier: 0.12 * multiplier },
      { key: "bundle_all_topics", label: "Bundle: 3 темы", multiplier: 0.1 * multiplier },
    ]),
    byTheme: buildBreakdown([
      { key: "money", label: "Money", multiplier: 0.35 * multiplier },
      { key: "relationships", label: "Relationships", multiplier: 0.4 * multiplier },
      { key: "personality", label: "Personality", multiplier: 0.25 * multiplier },
    ]),
    byVisualPack: buildBreakdown([
      { key: "sky_clarity", label: "Sky Clarity", multiplier: 0.2 * multiplier },
      { key: "cosmic_pastel", label: "Cosmic Pastel", multiplier: 0.3 * multiplier },
      { key: "pink_love", label: "Pink Love", multiplier: 0.25 * multiplier },
      { key: "dark_gold_mystic", label: "Dark Gold Mystic", multiplier: 0.25 * multiplier },
    ]),
  };
}
