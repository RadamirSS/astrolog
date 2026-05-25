import type { TenantConfig } from "@astro/tenant-config";
import { resolveTheme, themeToCssVariables } from "./resolve";

export { themePresets } from "./presets";

/** Package 1 spec alias */
export { resolveTheme as resolveTenantTheme };

/** Package 1 spec alias — returns CSS variables from tenant config */
export function getThemeCssVariables(config: TenantConfig): Record<string, string> {
  return themeToCssVariables(resolveTheme(config));
}

/** Returns preset-based utility class names for common UI patterns */
export function getThemeClassNames(config: TenantConfig): Record<string, string> {
  const tokens = resolveTheme(config);
  const cardClasses: Record<string, string> = {
    flat: "border border-[var(--color-border)] shadow-none",
    elevated: "border border-[var(--color-border)] shadow-lg",
    glass: "border border-[var(--color-border)] backdrop-blur-md",
  };
  const buttonClasses: Record<string, string> = {
    rounded: "rounded-xl",
    pill: "rounded-full",
    sharp: "rounded-sm",
  };

  return {
    page: "min-h-screen text-[var(--color-text)]",
    card: cardClasses[tokens.cardStyle] ?? cardClasses.elevated ?? "",
    button: buttonClasses[tokens.buttonStyle] ?? buttonClasses.rounded ?? "",
    preset: config.theme.preset,
  };
}
