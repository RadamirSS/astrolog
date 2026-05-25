import type { CardStyle, ButtonStyle, ThemePreset } from "@astro/tenant-config";

export interface ThemeTokens {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  radiusCard: string;
  radiusButton: string;
  shadowCard: string;
  fontFamily: string;
  backgroundType: "solid" | "gradient" | "image";
  backgroundGradient?: string;
  backgroundImageUrl?: string;
  cardStyle: CardStyle;
  buttonStyle: ButtonStyle;
  heroImageUrl?: string;
}

export const themePresets: Record<ThemePreset, ThemeTokens> = {
  "mystic-dark": {
    primary: "#7C3AED",
    accent: "#F59E0B",
    background: "#0F0A1A",
    surface: "#1A1229",
    text: "#F5F3FF",
    textMuted: "#A78BFA",
    border: "#2E1065",
    radiusCard: "16px",
    radiusButton: "12px",
    shadowCard: "0 8px 32px rgba(124, 58, 237, 0.15)",
    fontFamily: "Georgia, serif",
    backgroundType: "gradient",
    backgroundGradient: "linear-gradient(180deg, #0F0A1A 0%, #1E1033 100%)",
    cardStyle: "elevated",
    buttonStyle: "rounded",
  },
  "soft-feminine": {
    primary: "#DB7093",
    accent: "#E8B4B8",
    background: "#FFF5F5",
    surface: "#FFFFFF",
    text: "#4A3728",
    textMuted: "#9B7B6B",
    border: "#F5D0C5",
    radiusCard: "20px",
    radiusButton: "999px",
    shadowCard: "0 4px 20px rgba(219, 112, 147, 0.12)",
    fontFamily: "Georgia, serif",
    backgroundType: "solid",
    cardStyle: "flat",
    buttonStyle: "pill",
  },
  "cosmic-violet": {
    primary: "#8B5CF6",
    accent: "#06B6D4",
    background: "#130F2E",
    surface: "#1E1840",
    text: "#EDE9FE",
    textMuted: "#A5B4FC",
    border: "#3730A3",
    radiusCard: "16px",
    radiusButton: "12px",
    shadowCard: "0 8px 32px rgba(139, 92, 246, 0.2)",
    fontFamily: "system-ui, sans-serif",
    backgroundType: "gradient",
    backgroundGradient: "linear-gradient(180deg, #130F2E 0%, #2E1065 100%)",
    cardStyle: "glass",
    buttonStyle: "rounded",
  },
  "luxury-gold": {
    primary: "#D4AF37",
    accent: "#F5E6A3",
    background: "#0A0A0A",
    surface: "#141414",
    text: "#FAFAFA",
    textMuted: "#A3A3A3",
    border: "#3D3D3D",
    radiusCard: "8px",
    radiusButton: "4px",
    shadowCard: "0 4px 24px rgba(212, 175, 55, 0.1)",
    fontFamily: "Georgia, serif",
    backgroundType: "solid",
    cardStyle: "elevated",
    buttonStyle: "sharp",
  },
  "minimal-white": {
    primary: "#2563EB",
    accent: "#64748B",
    background: "#FFFFFF",
    surface: "#F8FAFC",
    text: "#0F172A",
    textMuted: "#64748B",
    border: "#E2E8F0",
    radiusCard: "12px",
    radiusButton: "8px",
    shadowCard: "0 1px 3px rgba(0, 0, 0, 0.08)",
    fontFamily: "system-ui, sans-serif",
    backgroundType: "solid",
    cardStyle: "flat",
    buttonStyle: "rounded",
  },
  "pink-moon": {
    primary: "#EC4899",
    accent: "#C084FC",
    background: "#1A0A14",
    surface: "#2D1B24",
    text: "#FCE7F3",
    textMuted: "#F9A8D4",
    border: "#831843",
    radiusCard: "20px",
    radiusButton: "999px",
    shadowCard: "0 8px 32px rgba(236, 72, 153, 0.15)",
    fontFamily: "Georgia, serif",
    backgroundType: "gradient",
    backgroundGradient: "linear-gradient(180deg, #1A0A14 0%, #4A1942 100%)",
    cardStyle: "glass",
    buttonStyle: "pill",
  },
};

export const THEME_PRESET_OPTIONS: { value: ThemePreset; label: string }[] = [
  { value: "mystic-dark", label: "Mystic Dark" },
  { value: "soft-feminine", label: "Soft Feminine" },
  { value: "cosmic-violet", label: "Cosmic Violet" },
  { value: "luxury-gold", label: "Luxury Gold" },
  { value: "minimal-white", label: "Minimal White" },
  { value: "pink-moon", label: "Pink Moon" },
];
