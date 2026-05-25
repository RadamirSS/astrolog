import type { ProductConfig, TenantConfig } from "@astro/tenant-config";

export function resolveProductCtaUrl(
  product: ProductConfig,
  config: TenantConfig
): string | null {
  const action = product.ctaAction ?? (product.ctaUrl ? "external" : undefined);

  switch (action) {
    case "external":
    case "whatsapp":
      return product.ctaUrl ?? null;
    case "telegram": {
      if (product.ctaUrl) return product.ctaUrl;
      if (config.brand.telegramUsername) {
        return `https://t.me/${config.brand.telegramUsername.replace(/^@/, "")}`;
      }
      return null;
    }
    case "request":
    case "coming-soon":
      return null;
    default:
      return product.ctaUrl ?? null;
  }
}

export function isProductCtaDisabled(product: ProductConfig): boolean {
  const action = product.ctaAction ?? (product.ctaUrl ? "external" : "coming-soon");
  if (action === "request" && product.level === "premium") return false;
  return action === "coming-soon" || action === "request";
}

export function getProductCtaLabel(
  product: ProductConfig,
  config: TenantConfig,
  fallbacks?: { comingSoon: string; contactTelegram: string }
): string {
  const comingSoon = fallbacks?.comingSoon ?? "Coming Soon";
  const contactTelegram = fallbacks?.contactTelegram ?? "Contact on Telegram";

  if (isProductCtaDisabled(product)) {
    return product.ctaAction === "request" ? product.ctaLabel : comingSoon;
  }
  if (product.ctaUrl || product.ctaAction === "external" || product.ctaAction === "whatsapp") {
    return product.ctaLabel;
  }
  if (product.ctaAction === "telegram" || config.brand.telegramUsername) {
    return product.ctaLabel || contactTelegram;
  }
  return product.ctaLabel;
}

export function handleProductCta(product: ProductConfig, config: TenantConfig): void {
  if (isProductCtaDisabled(product)) return;
  const url = resolveProductCtaUrl(product, config);
  if (url) window.open(url, "_blank");
}
