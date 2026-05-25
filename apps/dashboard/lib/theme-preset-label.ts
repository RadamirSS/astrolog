import type { ThemePreset } from "@astro/tenant-config";

const PRESET_I18N_KEYS: Record<ThemePreset, string> = {
  "mystic-dark": "dashboard.themePresets.mysticDark",
  "soft-feminine": "dashboard.themePresets.softFeminine",
  "cosmic-violet": "dashboard.themePresets.cosmicViolet",
  "luxury-gold": "dashboard.themePresets.luxuryGold",
  "minimal-white": "dashboard.themePresets.minimalWhite",
  "pink-moon": "dashboard.themePresets.pinkMoon",
};

type TranslateFn = (key: string) => string;

export function getThemePresetLabel(preset: ThemePreset, t: TranslateFn): string {
  const key = PRESET_I18N_KEYS[preset];
  return key ? t(key) : preset;
}
