"use client";

import { useState } from "react";

export type SafeImageVariant = "avatar" | "cover" | "logo";

interface SafeImageProps {
  src?: string | null;
  alt: string;
  fallback?: React.ReactNode;
  className?: string;
  variant?: SafeImageVariant;
}

function DefaultFallback({ variant, alt }: { variant: SafeImageVariant; alt: string }) {
  const initial = alt.trim().charAt(0).toUpperCase() || "✦";

  if (variant === "avatar") {
    return (
      <div
        className="flex h-full w-full items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_20%,var(--color-surface))] text-lg font-semibold text-[var(--color-primary)]"
        aria-hidden
      >
        {initial}
      </div>
    );
  }

  if (variant === "logo") {
    return (
      <div
        className="flex h-full w-full items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))] text-sm font-semibold text-[var(--color-primary)]"
        aria-hidden
      >
        {initial}
      </div>
    );
  }

  return (
    <div
      className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[color-mix(in_srgb,var(--color-primary)_25%,var(--color-surface))] to-[var(--color-surface)] text-3xl"
      aria-hidden
    >
      ✦
    </div>
  );
}

export function SafeImage({
  src,
  alt,
  fallback,
  className = "",
  variant = "cover",
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  if (!showImage) {
    return (
      <div className={`overflow-hidden ${className}`}>
        {fallback ?? <DefaultFallback variant={variant} alt={alt} />}
      </div>
    );
  }

  return (
    <img
      src={src!}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
