"use client";

import { useEffect, useMemo, useState } from "react";
import { getProduct, startCheckout } from "@astro/api-client";
import { useT } from "@astro/i18n";
import type { ProductConfig } from "@astro/tenant-config";
import { getVisualPackForProduct } from "@astro/tenant-config";
import { VisualPackScope } from "@astro/theme-engine";
import {
  AstroHero,
  Button,
  EmptyState,
  LoadingState,
  PageShell,
  PremiumFrame,
  ProductPdfMockup,
  SectionHeader,
} from "@astro/ui";
import { getAttribution } from "../attribution";
import { useMiniApp, useMiniAppNav } from "../context";
import { getProductCtaLabel, handleProductCta, isProductCtaDisabled } from "../productCta";
import { useMiniAppAnalytics, useTrackOnce } from "../useAnalytics";

export function ProductDetailScreen() {
  const { config, productId, previewMode, userId, birthProfile } = useMiniApp();
  const nav = useMiniAppNav();
  const { track } = useMiniAppAnalytics();
  const t = useT();
  const [product, setProduct] = useState<ProductConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const ctaFallbacks = useMemo(
    () => ({
      comingSoon: t("miniapp.productDetail.comingSoon"),
      contactTelegram: t("miniapp.productDetail.contactTelegram"),
    }),
    [t]
  );

  useEffect(() => {
    if (!productId) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    track("product_viewed", { productId });
    if (previewMode) {
      const fromConfig =
        config.products.find((p) => p.id === productId && p.status === "active") ?? null;
      setProduct(fromConfig);
      setNotFound(!fromConfig);
      setLoading(false);
      return;
    }
    let cancelled = false;
    getProduct(config.slug, productId).then((p) => {
      if (cancelled) return;
      setProduct(p);
      setNotFound(!p);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [config.slug, config.products, productId, previewMode, track]);

  useEffect(() => {
    if (product?.level === "premium") {
      track("premium_product_viewed", { productId: product.id });
    }
  }, [product, track]);

  if (loading) {
    return (
      <PageShell title={t("miniapp.productDetail.title")}>
        <LoadingState message={t("miniapp.productDetail.loading")} />
      </PageShell>
    );
  }

  if (notFound || !product) {
    return (
      <PageShell title={t("miniapp.productDetail.notFoundTitle")}>
        <EmptyState
          icon="✦"
          title={t("miniapp.productDetail.notFoundHeading")}
          description={t("miniapp.productDetail.notFoundDesc")}
        />
        <Button className="mt-4" onClick={nav.goProducts}>
          {t("miniapp.productDetail.backToOfferings")}
        </Button>
      </PageShell>
    );
  }

  async function handleCheckout() {
    if (product!.level === "free") return;
    setCheckoutLoading(true);
    setCheckoutStatus(null);
    track("checkout_started", { productId: product!.id, productType: product!.productType });
    try {
      const attr = getAttribution();
      const result = await startCheckout({
        tenantId: config.tenantId,
        tenantSlug: config.slug,
        productId: product!.id,
        productType: product!.productType,
        theme: birthProfile?.topic,
        locale: "ru",
        birth: birthProfile
          ? {
              name: birthProfile.name,
              birthDate: birthProfile.birthDate,
              birthTime: birthProfile.birthTime,
              timeAccuracy: birthProfile.timeAccuracy ?? "unknown",
              birthPlace: birthProfile.birthPlace,
            }
          : undefined,
        partner: attr?.partnerId || attr?.partnerSlug
          ? {
              partnerId: attr.partnerId,
              partnerSlug: attr.partnerSlug,
              campaignId: attr.campaignId,
              utmSource: attr.utmSource,
              utmMedium: attr.utmMedium,
              utmCampaign: attr.utmCampaign,
              clickId: attr.clickId,
            }
          : undefined,
      });
      track("payment_created", {
        productId: product!.id,
        paymentId: result.paymentId,
        orderId: result.orderId,
      });
      track("payment_redirected", { orderId: result.orderId });
      if (typeof window !== "undefined" && result.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }
      setCheckoutStatus(t("miniapp.productDetail.checkoutPending", { orderId: result.orderId }));
    } catch (err) {
      setCheckoutStatus(err instanceof Error ? err.message : t("miniapp.productDetail.checkoutError"));
    } finally {
      setCheckoutLoading(false);
    }
  }

  function handlePrimaryCta() {
    track("product_cta_clicked", { productId: product!.id, source: "detail" });
    if (product!.level === "premium") {
      track("premium_request_started", { productId: product!.id, source: "product_detail" });
      nav.goPremiumRequest(product!.id);
      return;
    }
    if (product!.level !== "free") {
      void handleCheckout();
      return;
    }
    handleProductCta(product!, config);
  }

  const visualPack = getVisualPackForProduct(product);
  const isPremiumFrame = visualPack === "dark_gold_mystic";

  const contactLabel =
    product.level !== "free" && product.level !== "premium"
      ? t("miniapp.productDetail.startPurchase")
      : getProductCtaLabel(product, config, ctaFallbacks);
  const ctaDisabled = product.ctaAction === "coming-soon";

  const benefitsContent = (
    <>
      {(product.longDescription || product.description) && (
        <p className="leading-relaxed text-[var(--vp-text-muted,var(--color-text-muted))]">
          {product.longDescription ?? product.description}
        </p>
      )}

      {product.whatUserWillUnderstand && product.whatUserWillUnderstand.length > 0 && (
        <section className="mt-4">
          <SectionHeader
            title={t("miniapp.productDetail.whatYouWillUnderstand", {
              defaultValue: "What you will understand",
            })}
          />
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[var(--vp-text-muted,var(--color-text-muted))]">
            {product.whatUserWillUnderstand.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {product.includes && product.includes.length > 0 && (
        <section className="mt-4">
          <SectionHeader title={t("miniapp.productDetail.includes")} />
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[var(--vp-text-muted,var(--color-text-muted))]">
            {product.includes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {product.reportOutline && product.reportOutline.length > 0 && (
        <section className="mt-4">
          <SectionHeader
            title={t("miniapp.productDetail.outline", { defaultValue: "Report outline" })}
          />
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[var(--vp-text-muted,var(--color-text-muted))]">
            {product.reportOutline.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
      )}

      {product.excludes && product.excludes.length > 0 && (
        <section className="mt-4">
          <SectionHeader title={t("miniapp.productDetail.excludes")} />
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[var(--vp-text-muted,var(--color-text-muted))]">
            {product.excludes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {product.recommendedFor && product.recommendedFor.length > 0 && (
        <section className="mt-4">
          <SectionHeader
            title={t("miniapp.productDetail.recommendedFor", { defaultValue: "Recommended for" })}
          />
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[var(--vp-text-muted,var(--color-text-muted))]">
            {product.recommendedFor.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {product.notFor && product.notFor.length > 0 && (
        <section className="mt-4">
          <SectionHeader
            title={t("miniapp.productDetail.notFor", { defaultValue: "Not suitable if" })}
          />
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[var(--vp-text-muted,var(--color-text-muted))]">
            {product.notFor.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {(product.format || product.estimatedPages) && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-[var(--vp-text-muted,var(--color-text-muted))]">
            {t("miniapp.productDetail.format")}
          </h3>
          <p className="mt-1 text-[var(--vp-text,var(--color-text))]">
            {[product.format, product.estimatedPages].filter(Boolean).join(" · ")}
          </p>
        </div>
      )}

      {product.faq && product.faq.length > 0 && (
        <section className="mt-4 space-y-3">
          <SectionHeader title={t("miniapp.productDetail.faq", { defaultValue: "FAQ" })} />
          {product.faq.map((item) => (
            <div key={item.question}>
              <p className="text-sm font-medium text-[var(--vp-text,var(--color-text))]">
                {item.question}
              </p>
              <p className="mt-1 text-sm text-[var(--vp-text-muted,var(--color-text-muted))]">
                {item.answer}
              </p>
            </div>
          ))}
        </section>
      )}

      <p className="mt-4 text-xs leading-relaxed text-[var(--vp-text-muted,var(--color-text-muted))]">
        {product.disclaimer ?? t("report.disclaimer")}
      </p>
    </>
  );

  return (
    <VisualPackScope pack={visualPack}>
      <PageShell
        footer={
          <div className="flex flex-col gap-2">
            <Button fullWidth onClick={handlePrimaryCta} disabled={ctaDisabled || checkoutLoading}>
              {checkoutLoading ? t("common.loading") : contactLabel}
            </Button>
            {checkoutStatus && (
              <p className="text-center text-xs text-[var(--color-text-muted)]">{checkoutStatus}</p>
            )}
            <Button variant="ghost" fullWidth onClick={nav.goProducts}>
              {t("miniapp.productDetail.backToOfferings")}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <AstroHero
            pack={visualPack}
            title={product.title}
            subtitle={product.subtitle}
          />

          <div className="mx-auto w-full max-w-[200px]">
            <ProductPdfMockup
              pack={visualPack}
              title={product.title}
              subtitle={product.subtitle}
              depthLabel={product.format}
              priceLabel={product.priceLabel}
            />
          </div>

          {product.featured && (
            <span className="w-fit rounded-full bg-[var(--vp-accent,var(--color-primary))] px-3 py-1 text-xs text-white">
              {t("common.featured")}
            </span>
          )}

          {product.priceLabel && (
            <p className="text-lg font-semibold text-[var(--vp-accent,var(--color-accent,var(--color-primary)))]">
              {product.priceLabel}
            </p>
          )}

          {isPremiumFrame ? (
            <PremiumFrame title={t("miniapp.productDetail.includes")}>
              {benefitsContent}
            </PremiumFrame>
          ) : (
            benefitsContent
          )}
        </div>
      </PageShell>
    </VisualPackScope>
  );
}
