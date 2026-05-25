"use client";

import type { ProductConfig, ProductLevel } from "@astro/tenant-config";
import { getVisualPackForProduct } from "@astro/tenant-config";
import { useT } from "@astro/i18n";
import { ProductPdfMockup } from "./astro/ProductPdfMockup";
import { Button } from "./Button";
import { Card } from "./Card";

interface ProductCardProps {
  product: ProductConfig;
  onDetail?: () => void;
  onCta?: () => void;
  compact?: boolean;
  visual?: boolean;
}

const LEVEL_KEYS: Record<ProductLevel, string> = {
  free: "miniapp.paywall.tiers.free",
  low_ticket: "miniapp.paywall.tiers.low_ticket",
  bundle: "miniapp.paywall.tiers.bundle",
  main: "miniapp.paywall.tiers.main",
  premium: "miniapp.paywall.tiers.premium",
};

export function ProductCard({
  product,
  onDetail,
  onCta,
  compact = false,
  visual = false,
}: ProductCardProps) {
  const t = useT();
  const visualPack = getVisualPackForProduct(product);
  const levelLabel = product.level ? t(LEVEL_KEYS[product.level]) : null;

  return (
    <Card
      className={
        product.featured
          ? "border-[color-mix(in_srgb,var(--color-primary)_35%,var(--color-border))] ring-1 ring-[color-mix(in_srgb,var(--color-primary)_20%,transparent)]"
          : undefined
      }
    >
      <div className={`flex flex-col ${compact ? "gap-2" : "gap-3"}`}>
        {product.featured && (
          <div className="-mx-4 -mt-4 mb-1 h-1 rounded-t-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent,var(--color-primary))]" />
        )}

        <div className="flex gap-3">
          {visual && (
            <div className="w-20 shrink-0">
              <ProductPdfMockup
                pack={visualPack}
                title={product.title}
                subtitle={product.subtitle}
                depthLabel={product.format}
                priceLabel={product.priceLabel}
                locked={
                  product.level !== "free" &&
                  product.level !== "premium" &&
                  (product.price ?? 0) > 0
                }
                className="!max-h-[100px]"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <button type="button" className="w-full text-left" onClick={onDetail}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-[var(--color-text)]">{product.title}</h3>
                {levelLabel && (
                  <span className="rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-primary)]">
                    {levelLabel}
                  </span>
                )}
              </div>
              {product.subtitle && (
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)] line-clamp-2">
                  {product.subtitle}
                </p>
              )}
            </button>
            {product.featured && (
              <span className="mt-2 inline-block rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs text-white">
                {t("ui.featured")}
              </span>
            )}
          </div>
        </div>

        {product.description && (
          <p className={`text-[var(--color-text-muted)] ${compact ? "text-xs line-clamp-2" : "text-sm"}`}>
            {product.description}
          </p>
        )}
        {product.priceLabel && (
          <p className="text-sm font-semibold text-[var(--color-accent,var(--color-primary))]">
            {product.priceLabel}
          </p>
        )}
        <div className="flex gap-2 pt-1">
          {onDetail && (
            <Button variant="ghost" className="flex-1" onClick={onDetail}>
              {t("ui.details")}
            </Button>
          )}
          <Button variant="secondary" className="flex-1" onClick={onCta}>
            {product.ctaLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
}
