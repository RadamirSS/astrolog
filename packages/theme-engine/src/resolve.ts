import type { CSSProperties } from "react";
import type { TenantConfig } from "@astro/tenant-config";
import { themePresets, type ThemeTokens } from "./presets";

const buttonRadiusMap = {
  rounded: "12px",
  pill: "999px",
  sharp: "4px",
} as const;

export function resolveTheme(config: TenantConfig): ThemeTokens {
  const base = { ...themePresets[config.theme.preset] };
  const overrides = config.theme.overrides ?? {};

  if (overrides.primaryColor) base.primary = overrides.primaryColor;
  if (overrides.accentColor) base.accent = overrides.accentColor;
  if (overrides.backgroundType) base.backgroundType = overrides.backgroundType;
  if (overrides.backgroundImageUrl) base.backgroundImageUrl = overrides.backgroundImageUrl;
  if (overrides.cardStyle) base.cardStyle = overrides.cardStyle;
  if (overrides.buttonStyle) {
    base.buttonStyle = overrides.buttonStyle;
    base.radiusButton = buttonRadiusMap[overrides.buttonStyle];
  }
  if (overrides.heroImageUrl) base.heroImageUrl = overrides.heroImageUrl;

  return base;
}

export function themeToCssVariables(tokens: ThemeTokens): Record<string, string> {
  return {
    "--color-primary": tokens.primary,
    "--color-accent": tokens.accent,
    "--color-bg": tokens.background,
    "--color-surface": tokens.surface,
    "--color-text": tokens.text,
    "--color-text-muted": tokens.textMuted,
    "--color-border": tokens.border,
    "--radius-card": tokens.radiusCard,
    "--radius-button": tokens.radiusButton,
    "--shadow-card": tokens.shadowCard,
    "--font-family": tokens.fontFamily,
  };
}

export function getBackgroundStyle(tokens: ThemeTokens): CSSProperties {
  if (tokens.backgroundType === "image" && tokens.backgroundImageUrl) {
    return {
      backgroundImage: `url(${tokens.backgroundImageUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  if (tokens.backgroundType === "gradient" && tokens.backgroundGradient) {
    return { background: tokens.backgroundGradient };
  }
  return { backgroundColor: tokens.background };
}
