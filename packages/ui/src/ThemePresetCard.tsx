import type { ThemePreset } from "@astro/tenant-config";
import { themePresets } from "@astro/theme-engine";

interface ThemePresetCardProps {
  preset: ThemePreset;
  label: string;
  selected: boolean;
  onSelect: () => void;
}

export function ThemePresetCard({ preset, label, selected, onSelect }: ThemePresetCardProps) {
  const tokens = themePresets[preset];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`overflow-hidden rounded-xl border text-left transition-all ${
        selected
          ? "border-violet-500 ring-2 ring-violet-500/30"
          : "border-slate-700 hover:border-slate-600"
      }`}
    >
      <div
        className="flex h-16 items-end gap-1 p-2"
        style={{
          background:
            tokens.backgroundGradient ??
            (tokens.backgroundType === "gradient"
              ? `linear-gradient(135deg, ${tokens.background}, ${tokens.surface})`
              : tokens.background),
        }}
      >
        <span
          className="h-6 w-6 rounded-md border border-white/10"
          style={{ backgroundColor: tokens.primary }}
        />
        <span
          className="h-6 w-6 rounded-md border border-white/10"
          style={{ backgroundColor: tokens.accent }}
        />
        <span
          className="ml-auto h-8 w-12 rounded-md border border-white/10"
          style={{ backgroundColor: tokens.surface }}
        />
      </div>
      <div className="border-t border-slate-800 bg-slate-900 px-3 py-2">
        <p className="text-sm font-medium text-slate-200">{label}</p>
      </div>
    </button>
  );
}
