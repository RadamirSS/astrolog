"use client";

import type { VisualPack } from "@astro/tenant-config";
import { VisualPackScope } from "@astro/theme-engine";

interface ProductPdfMockupProps {
  pack: VisualPack;
  title: string;
  subtitle?: string;
  depthLabel?: string;
  priceLabel?: string;
  locked?: boolean;
  lockedLabel?: string;
  className?: string;
}

export function ProductPdfMockup({
  pack,
  title,
  subtitle,
  depthLabel,
  priceLabel,
  locked = false,
  lockedLabel = "Заблокировано",
  className = "",
}: ProductPdfMockupProps) {
  return (
    <VisualPackScope pack={pack}>
      <div
        className={`relative overflow-hidden rounded-xl border ${className}`}
        style={{
          background: "var(--vp-gradient)",
          borderColor: "var(--vp-card-border)",
          boxShadow: "var(--vp-card-glow)",
          aspectRatio: "3/4",
          maxHeight: 200,
        }}
      >
        <div className="absolute inset-0 p-4 flex flex-col justify-between">
          <div>
            {locked && (
              <span className="mb-2 inline-block rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                🔒 {lockedLabel}
              </span>
            )}
            <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--vp-accent)] opacity-80">
              PDF
            </p>
            <h4 className="mt-1 text-sm font-bold leading-tight text-[var(--vp-text)] line-clamp-3">
              {title}
            </h4>
            {subtitle && (
              <p className="mt-1 text-[10px] leading-snug text-[var(--vp-text-muted)] line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-end justify-between">
            {depthLabel && (
              <span className="text-[10px] text-[var(--vp-text-muted)]">{depthLabel}</span>
            )}
            {priceLabel && (
              <span className="text-xs font-semibold text-[var(--vp-accent)]">{priceLabel}</span>
            )}
          </div>
        </div>
        <div
          className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-20"
          style={{ background: "var(--vp-accent)" }}
        />
      </div>
    </VisualPackScope>
  );
}
