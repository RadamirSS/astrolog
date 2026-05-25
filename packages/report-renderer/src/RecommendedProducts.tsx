"use client";

import type { ProductConfig } from "@astro/tenant-config";
import { useT } from "@astro/i18n";
import { ProductCard, SectionHeader } from "@astro/ui";

interface RecommendedProductsProps {
  products: ProductConfig[];
  onProductClick?: (productId: string) => void;
}

export function RecommendedProducts({ products, onProductClick }: RecommendedProductsProps) {
  const t = useT();

  if (products.length === 0) return null;

  return (
    <section className="space-y-3 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-surface))] p-4">
      <SectionHeader
        title={t("report.recommendedTitle")}
        subtitle={t("report.recommendedSubtitle")}
      />
      <div className="flex flex-col gap-2">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            compact
            onCta={() => onProductClick?.(product.id)}
          />
        ))}
      </div>
    </section>
  );
}
