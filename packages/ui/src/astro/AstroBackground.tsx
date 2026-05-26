"use client";

import type { VisualPack } from "@astro/tenant-config";
import type { ReactNode } from "react";

interface AstroBackgroundProps {
  pack: VisualPack;
  className?: string;
  children?: ReactNode;
}

function StarsDecoration() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {[...Array(12)].map((_, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-[var(--vp-ornament)]"
          style={{
            width: i % 3 === 0 ? 3 : 2,
            height: i % 3 === 0 ? 3 : 2,
            top: `${8 + (i * 7) % 80}%`,
            left: `${5 + (i * 11) % 90}%`,
            opacity: 0.4 + (i % 4) * 0.15,
          }}
        />
      ))}
    </div>
  );
}

function CloudDecoration({ variant }: { variant?: "sky" | "pink" }) {
  const opacity = variant === "pink" ? 0.7 : 0.55;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute -left-8 top-8 h-20 w-36 rounded-full blur-md"
        style={{ background: "var(--vp-ornament)", opacity }}
      />
      <div
        className="absolute -right-4 top-24 h-16 w-32 rounded-full blur-md"
        style={{ background: "var(--vp-ornament)", opacity: opacity - 0.1 }}
      />
      <div
        className="absolute bottom-16 left-1/4 h-16 w-40 rounded-full blur-md"
        style={{ background: "var(--vp-ornament)", opacity: opacity - 0.15 }}
      />
      {variant === "sky" && (
        <div
          className="absolute right-8 top-12 h-3 w-3 rounded-full"
          style={{ background: "var(--vp-accent)", opacity: 0.85, boxShadow: "0 0 12px var(--vp-accent)" }}
        />
      )}
    </div>
  );
}

function ZodiacDots() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {[...Array(8)].map((_, i) => (
        <span
          key={i}
          className="absolute rounded-full border border-[var(--vp-accent-muted)]"
          style={{
            width: 6 + (i % 3) * 2,
            height: 6 + (i % 3) * 2,
            top: `${12 + i * 10}%`,
            left: `${10 + (i * 13) % 80}%`,
            opacity: 0.35,
          }}
        />
      ))}
    </div>
  );
}

function CandleGlow() {
  return (
    <div className="pointer-events-none absolute bottom-8 left-6 h-16 w-16 rounded-full blur-2xl" aria-hidden style={{ background: "var(--vp-accent)", opacity: 0.25 }} />
  );
}

function MoonDecoration() {
  return (
    <div className="pointer-events-none absolute right-4 top-4 opacity-30" aria-hidden>
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <path
          d="M38 24c0 10-8 18-18 18-2 0-4-.3-5.8-.9C18 44 24 46 30 46c11 0 20-9 20-20 0-6-2.6-11.4-6.8-15.2C44 13 38 24 38 24z"
          fill="var(--vp-accent)"
        />
      </svg>
    </div>
  );
}

function OrnamentFrame() {
  return (
    <>
      <div className="pointer-events-none absolute inset-2 rounded-xl border border-[var(--vp-accent-muted)] opacity-50" aria-hidden />
      <div className="pointer-events-none absolute inset-4 rounded-lg border border-[var(--vp-accent)] opacity-20" aria-hidden />
    </>
  );
}

export function AstroBackground({ pack, className = "", children }: AstroBackgroundProps) {
  const showStars = pack === "dark_gold_mystic" || pack === "cosmic_pastel";
  const showClouds = pack === "sky_clarity" || pack === "pink_love";
  const showMoon = pack === "dark_gold_mystic" || pack === "pink_love";
  const showOrnament = pack === "dark_gold_mystic";
  const cloudVariant = pack === "pink_love" ? "pink" : "sky";

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: "var(--vp-gradient, var(--color-bg))" }}
    >
      {showStars && <StarsDecoration />}
      {pack === "cosmic_pastel" && <ZodiacDots />}
      {showClouds && <CloudDecoration variant={cloudVariant} />}
      {showMoon && <MoonDecoration />}
      {showOrnament && <OrnamentFrame />}
      {showOrnament && <CandleGlow />}
      {children}
    </div>
  );
}
