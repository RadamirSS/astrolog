"use client";

import { useT } from "@astro/i18n";
import { Button, EmptyState, PageShell, ProductCard } from "@astro/ui";
import { useMiniApp, useMiniAppNav } from "../context";
import { useMiniAppAnalytics, useTrackOnce } from "../useAnalytics";

export function ProductsScreen() {
  const { config } = useMiniApp();
  const nav = useMiniAppNav();
  const { track } = useMiniAppAnalytics();
  const t = useT();

  useTrackOnce("product_list_viewed");

  const products = [...config.products]
    .filter((p) => p.status === "active")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <PageShell
      title={t("miniapp.products.title")}
      subtitle={config.content.productsIntro}
      footer={
        <Button variant="ghost" fullWidth onClick={nav.goHome}>
          {t("miniapp.products.backToHome")}
        </Button>
      }
    >
      {products.length === 0 ? (
        <EmptyState
          icon="✦"
          title={t("miniapp.products.emptyTitle")}
          description={t("miniapp.products.emptyDesc")}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              visual
              onDetail={() => {
                track("product_clicked", { productId: product.id, source: "products" });
                nav.goProductDetail(product.id);
              }}
              onCta={() => {
                track("product_cta_clicked", { productId: product.id, source: "products" });
                nav.goProductDetail(product.id);
              }}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
