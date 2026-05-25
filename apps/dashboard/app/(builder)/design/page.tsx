"use client";

import { THEME_PRESET_OPTIONS, resolveTheme } from "@astro/theme-engine";
import {
  FUNNEL_TOPICS,
  VISUAL_PACK_LABELS,
  createDefaultMiniApp,
  type FunnelTopic,
  type MiniAppConfig,
  type VisualPack,
} from "@astro/tenant-config";
import { ColorInput, FormActions, Input, SectionCard, Select, ThemePresetCard } from "@astro/ui";
import { useT } from "@astro/i18n";
import { useDashboard } from "../../components/DashboardProvider";
import { EditorLayout } from "../../../components/EditorLayout";
import { useFieldValidation } from "../../../hooks/useFieldValidation";
import { useDashboardAnalytics } from "../../../lib/useDashboardAnalytics";
import { getThemePresetLabel } from "../../../lib/theme-preset-label";

export default function DesignPage() {
  const t = useT();
  const { config, loading, updateConfig, saveDraft, resetToSaved, saving, isDirty, tenantId } =
    useDashboard();
  const { getError } = useFieldValidation(config);
  const track = useDashboardAnalytics(tenantId, config?.slug);

  if (loading || !config) return <p className="text-slate-400">{t("dashboard.design.loading")}</p>;

  const overrides = config.theme.overrides ?? {};
  const tokens = resolveTheme(config);

  function updateTheme(field: string, value: string | undefined) {
    updateConfig((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        overrides: { ...prev.theme.overrides, [field]: value || undefined },
      },
    }));
  }

  function updatePreset(preset: string) {
    updateConfig((prev) => ({
      ...prev,
      theme: { ...prev.theme, preset: preset as typeof prev.theme.preset },
    }));
  }

  function resetDesign() {
    updateConfig((prev) => ({
      ...prev,
      theme: { preset: prev.theme.preset, overrides: {} },
    }));
  }

  function updateMiniApp(patch: Partial<MiniAppConfig>) {
    updateConfig((prev) => ({
      ...prev,
      miniApp: {
        ...(prev.miniApp ?? createDefaultMiniApp(prev.slug)),
        ...patch,
      },
    }));
  }

  const miniApp = config.miniApp ?? createDefaultMiniApp(config.slug);
  const visualPacks = Object.keys(VISUAL_PACK_LABELS) as VisualPack[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("dashboard.design.title")}</h1>
        <p className="text-slate-400">{t("dashboard.design.subtitle")}</p>
      </div>

      <EditorLayout config={config}>
        <SectionCard title={t("dashboard.design.themePreset")}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {THEME_PRESET_OPTIONS.map((option) => (
              <ThemePresetCard
                key={option.value}
                preset={option.value}
                label={getThemePresetLabel(option.value, t)}
                selected={config.theme.preset === option.value}
                onSelect={() => updatePreset(option.value)}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title={t("dashboard.design.visualPack", { defaultValue: "Visual pack" })}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {visualPacks.map((pack) => (
              <button
                key={pack}
                type="button"
                onClick={() => updateMiniApp({ visualPack: pack })}
                className={`rounded-lg border px-4 py-3 text-left text-sm ${
                  miniApp.visualPack === pack
                    ? "border-violet-500 bg-violet-950/40 text-white"
                    : "border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {VISUAL_PACK_LABELS[pack].ru}
              </button>
            ))}
          </div>
          <div className="mt-4">
          <Select
            label={t("dashboard.design.defaultTopic", { defaultValue: "Default topic" })}
            value={miniApp.defaultTopic ?? ""}
            options={[
              { value: "", label: t("dashboard.design.noDefaultTopic", { defaultValue: "None" }) },
              ...FUNNEL_TOPICS.map((topic) => ({
                value: topic,
                label: topic,
              })),
            ]}
            onChange={(e) =>
              updateMiniApp({
                defaultTopic: (e.target.value || null) as FunnelTopic | null,
              })
            }
          />
          </div>
        </SectionCard>

        <SectionCard title={t("dashboard.design.colors")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorInput
              label={t("dashboard.design.primaryColor")}
              value={overrides.primaryColor ?? ""}
              error={getError("theme.overrides.primaryColor")}
              onChange={(value) => updateTheme("primaryColor", value)}
            />
            <ColorInput
              label={t("dashboard.design.accentColor")}
              value={overrides.accentColor ?? ""}
              error={getError("theme.overrides.accentColor")}
              onChange={(value) => updateTheme("accentColor", value)}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { label: t("dashboard.design.primary"), color: tokens.primary },
              { label: t("dashboard.design.accent"), color: tokens.accent },
              { label: t("dashboard.design.background"), color: tokens.background },
              { label: t("dashboard.design.surface"), color: tokens.surface },
            ].map((chip) => (
              <span
                key={chip.label}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1 text-xs"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: chip.color }}
                />
                {chip.label}
              </span>
            ))}
          </div>
        </SectionCard>

        <SectionCard title={t("dashboard.design.styleOptions")}>
          <div className="space-y-4">
            <Select
              label={t("dashboard.design.backgroundType")}
              value={overrides.backgroundType ?? "solid"}
              options={[
                { value: "solid", label: t("dashboard.design.solid") },
                { value: "gradient", label: t("dashboard.design.gradient") },
                { value: "image", label: t("dashboard.design.image") },
              ]}
              onChange={(e) => updateTheme("backgroundType", e.target.value)}
            />
            {overrides.backgroundType === "image" && (
              <Input
                label={t("dashboard.design.backgroundImageUrl")}
                value={overrides.backgroundImageUrl ?? ""}
                onChange={(e) => updateTheme("backgroundImageUrl", e.target.value)}
              />
            )}
            <Select
              label={t("dashboard.design.cardStyle")}
              value={overrides.cardStyle ?? "elevated"}
              options={[
                { value: "flat", label: t("dashboard.design.flat") },
                { value: "elevated", label: t("dashboard.design.elevated") },
                { value: "glass", label: t("dashboard.design.glass") },
              ]}
              onChange={(e) => updateTheme("cardStyle", e.target.value)}
            />
            <Select
              label={t("dashboard.design.buttonStyle")}
              value={overrides.buttonStyle ?? "rounded"}
              options={[
                { value: "rounded", label: t("dashboard.design.rounded") },
                { value: "pill", label: t("dashboard.design.pill") },
                { value: "sharp", label: t("dashboard.design.sharp") },
              ]}
              onChange={(e) => updateTheme("buttonStyle", e.target.value)}
            />
            <Input
              label={t("dashboard.design.heroImageUrl")}
              value={overrides.heroImageUrl ?? ""}
              onChange={(e) => updateTheme("heroImageUrl", e.target.value)}
            />
          </div>
          <FormActions
            onSave={async () => {
              await saveDraft();
              track("dashboard_design_saved");
            }}
            onReset={resetToSaved}
            saving={saving}
            isDirty={isDirty}
            saveLabel={t("ui.saveChanges")}
            resetLabel={t("ui.resetToSaved")}
          />
          <button
            type="button"
            onClick={resetDesign}
            className="mt-3 text-sm text-violet-400 hover:underline"
          >
            {t("dashboard.design.resetDefaults")}
          </button>
        </SectionCard>
      </EditorLayout>
    </div>
  );
}
