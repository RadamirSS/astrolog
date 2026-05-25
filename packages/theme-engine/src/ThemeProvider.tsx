"use client";

import type { ReactNode, CSSProperties } from "react";
import type { TenantConfig } from "@astro/tenant-config";
import { resolveTheme, themeToCssVariables, getBackgroundStyle } from "./resolve";

interface ThemeProviderProps {
  config: TenantConfig;
  children: ReactNode;
  className?: string;
}

export function ThemeProvider({ config, children, className }: ThemeProviderProps) {
  const tokens = resolveTheme(config);
  const cssVars = themeToCssVariables(tokens);
  const bgStyle = getBackgroundStyle(tokens);

  const style: CSSProperties = {
    ...cssVars,
    ...bgStyle,
    color: tokens.text,
    fontFamily: tokens.fontFamily,
    minHeight: "100%",
  };

  return (
    <div className={className} style={style} data-theme={config.theme.preset}>
      {children}
    </div>
  );
}
