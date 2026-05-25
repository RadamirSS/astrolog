"use client";

import type { VisualPack } from "@astro/tenant-config";
import { Button } from "../Button";
import { ProductPdfMockup } from "./ProductPdfMockup";

export interface PaywallTier {
  level: string;
  levelLabel: string;
  title: string;
  description: string;
  priceLabel: string;
  productId?: string;
  visualPack: VisualPack;
  depthLabel?: string;
  isPrimary?: boolean;
  isFree?: boolean;
  ctaLabel?: string;
  onSelect?: () => void;
}

interface PaywallComparisonProps {
  tiers: PaywallTier[];
  introText?: string;
  unlocksTitle?: string;
  unlocksText?: string;
}

export function PaywallComparison({
  tiers,
  introText,
  unlocksTitle,
  unlocksText,
}: PaywallComparisonProps) {
  return (
    <div className="flex flex-col gap-4">
      {introText && (
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{introText}</p>
      )}

      {unlocksTitle && unlocksText && (
        <div
          className="rounded-xl border px-4 py-3"
          style={{
            borderColor: "var(--vp-card-border, var(--color-border))",
            background: "color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))",
          }}
        >
          <p className="text-sm font-medium text-[var(--color-text)]">{unlocksTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">{unlocksText}</p>
        </div>
      )}

      {tiers.map((tier) => (
        <div
          key={tier.level}
          className={`rounded-2xl border p-4 ${
            tier.isPrimary ? "border-2 border-[var(--color-primary)]" : "border-[var(--color-border)]"
          }`}
          style={{
            background: tier.isPrimary
              ? "color-mix(in srgb, var(--color-primary) 6%, var(--color-surface))"
              : "var(--color-surface)",
          }}
        >
          <div className="flex gap-3">
            <div className="w-20 shrink-0">
              <ProductPdfMockup
                pack={tier.visualPack}
                title={tier.title}
                depthLabel={tier.depthLabel}
                priceLabel={tier.priceLabel}
                locked={tier.isFree}
                className="!max-h-[100px]"
              />
            </div>
            <div className="min-w-0 flex-1">
              {tier.isPrimary && (
                <span className="mb-1 inline-block rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[10px] font-medium text-white">
                  ★
                </span>
              )}
              <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
                {tier.levelLabel}
              </p>
              <h3 className="font-semibold text-[var(--color-text)]">{tier.title}</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-muted)]">
                {tier.description}
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-accent,var(--color-primary))]">
                {tier.priceLabel}
              </p>
            </div>
          </div>
          {tier.onSelect && !tier.isFree && tier.ctaLabel && (
            <Button
              variant={tier.isPrimary ? "primary" : "secondary"}
              className="mt-3"
              fullWidth
              onClick={tier.onSelect}
            >
              {tier.ctaLabel}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
