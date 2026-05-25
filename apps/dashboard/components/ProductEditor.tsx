"use client";

import { useMemo } from "react";
import type { ProductConfig, ProductCtaAction, ProductType, TenantConfig } from "@astro/tenant-config";
import { getVisualPackLabel } from "@astro/tenant-config";
import { useI18n, useT } from "@astro/i18n";
import { Button, Input, SectionCard, Select, Textarea, Toggle } from "@astro/ui";

interface ProductEditorProps {
  config: TenantConfig;
  product: ProductConfig;
  index: number;
  onUpdate: (id: string, patch: Partial<ProductConfig>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (index: number, direction: "up" | "down") => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  getError?: (path: string) => string | undefined;
}

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

const PRODUCT_TYPES: ProductType[] = [
  "consultation",
  "report",
  "course",
  "natal",
  "compatibility",
  "forecast",
  "custom",
];

const PRODUCT_CTA_ACTIONS: ProductCtaAction[] = [
  "telegram",
  "whatsapp",
  "external",
  "request",
  "coming-soon",
];

function ctaActionKey(action: ProductCtaAction): string {
  return action === "coming-soon" ? "comingSoon" : action;
}

export function ProductEditor({
  product,
  index,
  onUpdate,
  onDuplicate,
  onDelete,
  onMove,
  canMoveUp,
  canMoveDown,
  getError,
}: ProductEditorProps) {
  const t = useT();
  const { locale } = useI18n();
  const action = product.ctaAction ?? "external";
  const needsUrl = action === "external" || action === "whatsapp" || action === "telegram";

  const typeOptions = useMemo(
    () =>
      PRODUCT_TYPES.map((value) => ({
        value,
        label: t(`dashboard.productTypes.${value}`),
      })),
    [t]
  );

  const ctaOptions = useMemo(
    () =>
      PRODUCT_CTA_ACTIONS.map((value) => ({
        value,
        label: t(`dashboard.productCtaActions.${ctaActionKey(value)}`),
      })),
    [t]
  );

  return (
    <SectionCard
      title={product.title || t("dashboard.products.productFallback", { index: index + 1 })}
    >
      <div className="space-y-4">
        <Input
          label={t("dashboard.products.titleField")}
          value={product.title}
          error={getError?.(`products.${index}.title`)}
          onChange={(e) => onUpdate(product.id, { title: e.target.value })}
        />
        <Textarea
          label={t("dashboard.products.description")}
          value={product.description ?? ""}
          error={getError?.(`products.${index}.description`)}
          onChange={(e) => onUpdate(product.id, { description: e.target.value })}
        />
        <Select
          label={t("dashboard.products.type")}
          value={product.type}
          options={typeOptions}
          onChange={(e) => onUpdate(product.id, { type: e.target.value as ProductType })}
        />
        <Input
          label={t("dashboard.products.priceLabel")}
          value={product.priceLabel ?? ""}
          onChange={(e) => onUpdate(product.id, { priceLabel: e.target.value })}
        />
        <Input
          label={t("dashboard.products.mainButtonText")}
          value={product.ctaLabel}
          onChange={(e) => onUpdate(product.id, { ctaLabel: e.target.value })}
        />
        <Select
          label={t("dashboard.products.buttonAction")}
          value={action}
          options={ctaOptions}
          onChange={(e) =>
            onUpdate(product.id, { ctaAction: e.target.value as ProductCtaAction })
          }
        />
        {needsUrl && (
          <Input
            label={
              action === "telegram"
                ? t("dashboard.products.telegramLink")
                : t("dashboard.products.linkUrl")
            }
            value={product.ctaUrl ?? ""}
            placeholder={
              action === "telegram"
                ? "https://t.me/yourname or @username"
                : "https://your-site.com/book"
            }
            error={getError?.(`products.${index}.ctaUrl`)}
            onChange={(e) => onUpdate(product.id, { ctaUrl: e.target.value })}
          />
        )}
        <Toggle
          label={t("dashboard.products.featured")}
          checked={product.featured}
          onChange={(checked) => onUpdate(product.id, { featured: checked })}
        />
        <Toggle
          label={t("dashboard.products.active")}
          description={t("dashboard.products.activeDesc")}
          checked={product.status === "active"}
          onChange={(checked) =>
            onUpdate(product.id, { status: checked ? "active" : "hidden" })
          }
        />
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400">
          <p>
            {t("dashboard.products.productType")}: <strong className="text-slate-200">{product.productType}</strong>
          </p>
          <p>
            {t("dashboard.products.level")}: <strong className="text-slate-200">{product.level}</strong>
          </p>
          {product.theme && (
            <p>
              {t("dashboard.products.theme")}: <strong className="text-slate-200">{product.theme}</strong>
            </p>
          )}
          <p>
            {t("dashboard.products.visualPack")}:{" "}
            <strong className="text-slate-200">
              {getVisualPackLabel(product.visualPack, locale === "ru" ? "ru" : "en")}
            </strong>
            <span className="ml-1 text-slate-500">({product.visualPack})</span>
          </p>
          {product.price != null && (
            <p>
              {t("dashboard.products.price")}: <strong className="text-slate-200">{product.price}</strong>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-4">
          <Button type="button" variant="secondary" onClick={() => onDuplicate(product.id)}>
            {t("dashboard.products.duplicate")}
          </Button>
          <Button type="button" variant="ghost" disabled={!canMoveUp} onClick={() => onMove(index, "up")}>
            {t("dashboard.products.moveUp")}
          </Button>
          <Button type="button" variant="ghost" disabled={!canMoveDown} onClick={() => onMove(index, "down")}>
            {t("dashboard.products.moveDown")}
          </Button>
          <Button type="button" variant="ghost" onClick={() => onDelete(product.id)}>
            {t("dashboard.products.delete")}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

export function createEmptyProduct(config: TenantConfig, t: TranslateFn): ProductConfig {
  const slug = `product-${Date.now()}`;
  return {
    id: `${config.slug}-${slug}`,
    slug,
    type: "consultation",
    productType: "premium_consultation",
    level: "premium",
    title: t("dashboard.products.newServiceTitle"),
    description: t("dashboard.products.newServiceDesc"),
    price: 0,
    priceLabel: "",
    visualPack: "brand_default",
    ctaLabel: t("dashboard.products.ctaLabel"),
    ctaAction: "request",
    featured: false,
    sortOrder: config.products.length,
    status: "active",
  };
}

export function duplicateProduct(
  config: TenantConfig,
  product: ProductConfig,
  t: TranslateFn
): ProductConfig {
  const slug = `${product.slug}-copy-${Date.now()}`;
  return {
    ...product,
    id: `${config.slug}-${slug}`,
    slug,
    title: `${product.title}${t("dashboard.products.copySuffix")}`,
    sortOrder: config.products.length,
    featured: false,
  };
}
