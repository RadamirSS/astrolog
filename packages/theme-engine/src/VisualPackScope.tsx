"use client";

import type { VisualPack } from "@astro/tenant-config";
import type { CSSProperties, ReactNode } from "react";
import { getVisualPackClassName, visualPackToCssVariables } from "./visual-packs";

interface VisualPackScopeProps {
  pack: VisualPack;
  children: ReactNode;
  className?: string;
  fullBleed?: boolean;
}

export function VisualPackScope({
  pack,
  children,
  className = "",
  fullBleed = false,
}: VisualPackScopeProps) {
  const style: CSSProperties = {
    ...visualPackToCssVariables(pack),
    color: "var(--vp-text, var(--color-text))",
  };

  return (
    <div
      data-visual-pack={pack}
      className={`${getVisualPackClassName(pack)} ${fullBleed ? "relative" : ""} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}
