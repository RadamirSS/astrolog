"use client";

import {
  getLowTicketProductForTopic,
  getProductByType,
  getVisualPackForProduct,
  REAL_PRODUCT_CATALOG,
  type FunnelTopic,
} from "@astro/tenant-config";
import { useT } from "@astro/i18n";
import { Button, PageShell, PaywallComparison, type PaywallTier } from "@astro/ui";
import { useMiniApp, useMiniAppNav } from "../context";
import { useMiniAppAnalytics, useTrackOnce } from "../useAnalytics";

const PAYWALL_TIERS = [
  { level: "free", productType: "free_report" as const },
  { level: "low_ticket", productType: null },
  { level: "bundle", productType: "bundle_all_topics" as const },
  { level: "main", productType: "main_natal_portrait" as const },
  { level: "premium", productType: "premium_consultation" as const },
];

const DEPTH_BY_LEVEL: Record<string, string> = {
  free: "3",
  low_ticket: "15–20",
  bundle: "45+",
  main: "40–50",
  premium: "1:1",
};

export function PaywallScreen() {
  const { config, birthProfile, selectedTopic } = useMiniApp();
  const nav = useMiniAppNav();
  const { track } = useMiniAppAnalytics();
  const t = useT();
  const paywall = config.content.paywall;
  const topic: FunnelTopic = birthProfile?.topic ?? selectedTopic ?? "personality";
  const primaryProductType = getLowTicketProductForTopic(topic);
  const primaryProduct = getProductByType(config.products, primaryProductType);

  useTrackOnce("paywall_viewed", { topic });

  const tiers: PaywallTier[] = PAYWALL_TIERS.map((tier) => {
    const def =
      tier.productType != null
        ? REAL_PRODUCT_CATALOG.find((p) => p.productType === tier.productType)
        : REAL_PRODUCT_CATALOG.find((p) => p.productType === primaryProductType);
    const product =
      tier.productType != null
        ? getProductByType(config.products, tier.productType)
        : primaryProduct;
    const isPrimary = tier.level === "low_ticket";
    const visualPack = product ? getVisualPackForProduct(product) : def?.visualPack ?? "brand_default";

    return {
      level: tier.level,
      levelLabel: t(`miniapp.paywall.tiers.${tier.level}`),
      title: product?.title ?? def?.titleRu ?? "",
      description: t(`miniapp.paywall.tierDesc.${tier.level}`),
      priceLabel: product?.priceLabel ?? def?.priceLabelRu ?? "",
      productId: product?.id,
      visualPack,
      depthLabel: tier.level === "premium"
        ? t("miniapp.paywall.tiers.premium")
        : t("miniapp.paywall.depthPages", { pages: DEPTH_BY_LEVEL[tier.level] ?? "" }),
      isPrimary,
      isFree: tier.level === "free",
      ctaLabel: product?.ctaLabel,
      onSelect: product && tier.level !== "free"
        ? () => {
            track("product_clicked", { productId: product.id, source: isPrimary ? "paywall_primary" : "paywall_tier" });
            nav.goProductDetail(product.id);
          }
        : undefined,
    };
  });

  return (
    <PageShell
      title={paywall?.title ?? t("miniapp.paywall.title")}
      subtitle={paywall?.subtitle ?? t("miniapp.paywall.subtitle")}
      footer={
        primaryProduct ? (
          <Button
            fullWidth
            onClick={() => {
              track("product_clicked", { productId: primaryProduct.id, source: "paywall_primary" });
              nav.goProductDetail(primaryProduct.id);
            }}
          >
            {t("miniapp.paywall.primaryCta", { product: primaryProduct.title })}
          </Button>
        ) : undefined
      }
    >
      <PaywallComparison
        tiers={tiers}
        introText={t("miniapp.paywall.introText")}
        unlocksTitle={t("miniapp.paywall.unlocksTitle")}
        unlocksText={t("miniapp.paywall.unlocksText")}
      />
    </PageShell>
  );
}
