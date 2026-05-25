import type { Partner } from "@astro/api-contracts";
import type { RealProductType } from "@astro/tenant-config";

const BASE = "2026-05-01T10:00:00.000Z";

export type PartnerSeed = Partner & {
  activeProductTypes: RealProductType[];
  defaultTopic?: "money" | "relationships" | "personality";
  campaignId?: string;
};

export const MOCK_PARTNERS: PartnerSeed[] = [
  {
    id: "partner_nicole",
    tenantId: "tenant_mystic",
    name: "Nicole Astrology",
    slug: "nicole",
    status: "active",
    commissionRate: 0.5,
    defaultVisualPack: "pink_love",
    defaultTopic: "relationships",
    contact: "nicole@example.com",
    createdAt: BASE,
    clicks: 1240,
    leads: 380,
    freeReports: 290,
    paidOrders: 42,
    revenue: 2180,
    commission: 1090,
    unpaidCommission: 320,
    activeProductTypes: [
      "free_report",
      "low_ticket_relationships",
      "bundle_all_topics",
      "premium_consultation",
    ],
  },
  {
    id: "partner_luna",
    tenantId: "tenant_mystic",
    name: "Luna Guide",
    slug: "luna-guide",
    status: "active",
    commissionRate: 0.4,
    defaultVisualPack: "dark_gold_mystic",
    defaultTopic: "money",
    contact: "luna@example.com",
    createdAt: BASE,
    clicks: 890,
    leads: 210,
    freeReports: 175,
    paidOrders: 28,
    revenue: 1420,
    commission: 568,
    unpaidCommission: 180,
    activeProductTypes: [
      "free_report",
      "low_ticket_money",
      "main_natal_portrait",
      "premium_consultation",
    ],
  },
  {
    id: "partner_mira",
    tenantId: "tenant_mystic",
    name: "Astro Mira",
    slug: "astro-mira",
    status: "paused",
    commissionRate: 0.35,
    defaultVisualPack: "sky_clarity",
    contact: "mira@example.com",
    createdAt: BASE,
    clicks: 420,
    leads: 95,
    freeReports: 72,
    paidOrders: 11,
    revenue: 520,
    commission: 182,
    unpaidCommission: 45,
    activeProductTypes: ["free_report", "premium_consultation"],
  },
];

export function getPartnersForTenant(tenantId: string): PartnerSeed[] {
  return MOCK_PARTNERS.filter((p) => p.tenantId === tenantId);
}

export function getPartnerById(partnerId: string): PartnerSeed | undefined {
  return MOCK_PARTNERS.find((p) => p.id === partnerId);
}

export function resolvePartnerBySlug(
  slug: string
): (PartnerSeed & { tenantSlug: string }) | undefined {
  const partner = MOCK_PARTNERS.find((p) => p.slug === slug && p.status === "active");
  if (!partner) return undefined;
  const tenantSlugMap: Record<string, string> = {
    tenant_mystic: "mystic-dark",
    tenant_soft: "soft-feminine",
    tenant_luxury: "luxury-gold",
    tenant_luna: "luna-astro",
    tenant_cosmic: "cosmic-guide",
  };
  const tenantSlug = tenantSlugMap[partner.tenantId];
  if (!tenantSlug) return undefined;
  return { ...partner, tenantSlug };
}
