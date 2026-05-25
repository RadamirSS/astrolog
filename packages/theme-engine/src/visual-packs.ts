import type { VisualPack } from "@astro/tenant-config";

export interface VisualPackTokens {
  gradient: string;
  accent: string;
  accentMuted: string;
  cardBg: string;
  cardBorder: string;
  cardGlow: string;
  textOnPack: string;
  textMutedOnPack: string;
  ornament: string;
}

const PACK_TOKENS: Record<VisualPack, VisualPackTokens> = {
  sky_clarity: {
    gradient:
      "linear-gradient(165deg, #7ec8e3 0%, #a8d8f0 35%, #d4ecfa 70%, #eef7fc 100%)",
    accent: "#f5c842",
    accentMuted: "color-mix(in srgb, #f5c842 40%, transparent)",
    cardBg: "color-mix(in srgb, #ffffff 85%, transparent)",
    cardBorder: "color-mix(in srgb, #ffffff 60%, #7ec8e3)",
    cardGlow: "0 4px 24px color-mix(in srgb, #7ec8e3 25%, transparent)",
    textOnPack: "#1a3a52",
    textMutedOnPack: "color-mix(in srgb, #1a3a52 65%, transparent)",
    ornament: "color-mix(in srgb, #ffffff 70%, transparent)",
  },
  dark_gold_mystic: {
    gradient:
      "linear-gradient(165deg, #0a0a0f 0%, #1a1510 40%, #0f0d08 100%)",
    accent: "#c9a84c",
    accentMuted: "color-mix(in srgb, #c9a84c 35%, transparent)",
    cardBg: "color-mix(in srgb, #1a1810 90%, transparent)",
    cardBorder: "color-mix(in srgb, #c9a84c 45%, #2a2418)",
    cardGlow: "0 4px 32px color-mix(in srgb, #c9a84c 15%, transparent)",
    textOnPack: "#f5eed8",
    textMutedOnPack: "color-mix(in srgb, #f5eed8 60%, transparent)",
    ornament: "color-mix(in srgb, #c9a84c 25%, transparent)",
  },
  pink_love: {
    gradient:
      "linear-gradient(165deg, #f8c8dc 0%, #f5b8d0 30%, #eec4d8 60%, #fae8f0 100%)",
    accent: "#d4648a",
    accentMuted: "color-mix(in srgb, #d4648a 30%, transparent)",
    cardBg: "color-mix(in srgb, #ffffff 75%, #f8c8dc)",
    cardBorder: "color-mix(in srgb, #ffffff 50%, #d4648a)",
    cardGlow: "0 4px 24px color-mix(in srgb, #d4648a 18%, transparent)",
    textOnPack: "#5c2840",
    textMutedOnPack: "color-mix(in srgb, #5c2840 65%, transparent)",
    ornament: "color-mix(in srgb, #ffffff 60%, transparent)",
  },
  cosmic_pastel: {
    gradient:
      "linear-gradient(165deg, #c4b5fd 0%, #ddd6fe 25%, #fbcfe8 55%, #bfdbfe 85%, #e0e7ff 100%)",
    accent: "#7c6bc4",
    accentMuted: "color-mix(in srgb, #7c6bc4 30%, transparent)",
    cardBg: "color-mix(in srgb, #ffffff 78%, #ddd6fe)",
    cardBorder: "color-mix(in srgb, #ffffff 45%, #7c6bc4)",
    cardGlow: "0 4px 24px color-mix(in srgb, #7c6bc4 15%, transparent)",
    textOnPack: "#3d3566",
    textMutedOnPack: "color-mix(in srgb, #3d3566 65%, transparent)",
    ornament: "color-mix(in srgb, #ffffff 55%, transparent)",
  },
  brand_default: {
    gradient:
      "linear-gradient(165deg, color-mix(in srgb, var(--color-primary) 15%, var(--color-bg)), var(--color-bg))",
    accent: "var(--color-accent, var(--color-primary))",
    accentMuted: "color-mix(in srgb, var(--color-accent, var(--color-primary)) 30%, transparent)",
    cardBg: "var(--color-surface)",
    cardBorder: "var(--color-border)",
    cardGlow: "var(--shadow-card)",
    textOnPack: "var(--color-text)",
    textMutedOnPack: "var(--color-text-muted)",
    ornament: "color-mix(in srgb, var(--color-primary) 15%, transparent)",
  },
};

export function getVisualPackTokens(pack: VisualPack): VisualPackTokens {
  return PACK_TOKENS[pack] ?? PACK_TOKENS.brand_default;
}

export function visualPackToCssVariables(pack: VisualPack): Record<string, string> {
  const tokens = getVisualPackTokens(pack);
  return {
    "--vp-gradient": tokens.gradient,
    "--vp-accent": tokens.accent,
    "--vp-accent-muted": tokens.accentMuted,
    "--vp-card-bg": tokens.cardBg,
    "--vp-card-border": tokens.cardBorder,
    "--vp-card-glow": tokens.cardGlow,
    "--vp-text": tokens.textOnPack,
    "--vp-text-muted": tokens.textMutedOnPack,
    "--vp-ornament": tokens.ornament,
  };
}

export function getVisualPackClassName(pack: VisualPack): string {
  return pack === "brand_default" ? "visual-pack-default" : `visual-pack-${pack.replace(/_/g, "-")}`;
}
