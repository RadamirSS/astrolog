"use client";

import type { VisualPack } from "@astro/tenant-config";
import { VisualPackScope } from "@astro/theme-engine";
import type { ReactNode } from "react";
import { AstroBackground } from "./AstroBackground";
import { Button } from "../Button";

interface AstroHeroProps {
  pack: VisualPack;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
  logoUrl?: string | null;
  logoAlt?: string;
  children?: ReactNode;
}

export function AstroHero({
  pack,
  eyebrow,
  title,
  subtitle,
  ctaLabel,
  onCta,
  logoUrl,
  logoAlt,
  children,
}: AstroHeroProps) {
  return (
    <VisualPackScope pack={pack} className="overflow-hidden rounded-2xl">
      <AstroBackground pack={pack} className="px-5 py-8">
        {logoUrl && (
          <div className="mb-4 flex justify-center">
            <img src={logoUrl} alt={logoAlt ?? ""} className="h-8 w-auto max-w-[140px] object-contain" />
          </div>
        )}
        {eyebrow && (
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[var(--vp-accent)]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold leading-tight text-[var(--vp-text)] sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-base leading-relaxed text-[var(--vp-text-muted)]">{subtitle}</p>
        )}
        {ctaLabel && onCta && (
          <div className="mt-5">
            <Button onClick={onCta}>{ctaLabel}</Button>
          </div>
        )}
        {children}
      </AstroBackground>
    </VisualPackScope>
  );
}
