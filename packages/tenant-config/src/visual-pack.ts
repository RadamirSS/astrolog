import { DEFAULT_VISUAL_PACK_BY_PRODUCT_TYPE } from "./product-catalog";
import type {
  FunnelTopic,
  ProductConfig,
  ReportV2,
  VisualPack,
} from "./types";

export const VISUAL_PACK_LABELS: Record<VisualPack, { ru: string; en: string }> = {
  sky_clarity: { ru: "Небо и ясность", en: "Sky Clarity" },
  dark_gold_mystic: { ru: "Тёмное золото", en: "Dark Gold Mystic" },
  pink_love: { ru: "Розовая Луна", en: "Pink Moon" },
  cosmic_pastel: { ru: "Космическая пастель", en: "Cosmic Pastel" },
  brand_default: { ru: "Бренд по умолчанию", en: "Brand Default" },
};

const TOPIC_VISUAL_PACK: Record<FunnelTopic, VisualPack> = {
  money: "dark_gold_mystic",
  relationships: "pink_love",
  personality: "cosmic_pastel",
};

export function getVisualPackForTopic(topic: FunnelTopic): VisualPack {
  return TOPIC_VISUAL_PACK[topic];
}

export function getVisualPackForProduct(product: ProductConfig): VisualPack {
  if (product.visualPack && product.visualPack !== "brand_default") {
    return product.visualPack;
  }
  if (product.productType && product.productType in DEFAULT_VISUAL_PACK_BY_PRODUCT_TYPE) {
    return DEFAULT_VISUAL_PACK_BY_PRODUCT_TYPE[
      product.productType as keyof typeof DEFAULT_VISUAL_PACK_BY_PRODUCT_TYPE
    ];
  }
  if (product.theme) {
    return getVisualPackForTopic(product.theme);
  }
  return "brand_default";
}

export function getVisualPackForReport(report: ReportV2): VisualPack {
  return report.visualPack ?? "cosmic_pastel";
}

export function getVisualPackLabel(pack: VisualPack, locale: "ru" | "en" = "ru"): string {
  return VISUAL_PACK_LABELS[pack]?.[locale] ?? pack;
}

export function getLandingVisualPack(): VisualPack {
  return "sky_clarity";
}

export function getFreeReportVisualPack(entryVariant: "sky_clarity" | "cosmic_pastel" = "cosmic_pastel"): VisualPack {
  return entryVariant;
}
