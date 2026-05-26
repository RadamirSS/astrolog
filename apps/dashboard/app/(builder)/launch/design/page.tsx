"use client";

import {
  REFERENCE_VISUAL_PACKS,
  createDefaultMiniApp,
  FUNNEL_TOPICS,
  type VisualPack,
  type FunnelTopic,
  type MiniAppConfig,
} from "@astro/tenant-config";
import { useT } from "@astro/i18n";
import { ColorInput, FormActions, Input, SectionCard, Select } from "@astro/ui";
import { useDashboard } from "../../../components/DashboardProvider";
import { VisualPackCard } from "../../../../components/VisualPackCard";
import { useFieldValidation } from "../../../../hooks/useFieldValidation";
import { THEME_PRESET_OPTIONS, resolveTheme } from "@astro/theme-engine";
import { ThemePresetCard } from "@astro/ui";
import { getThemePresetLabel } from "../../../../lib/theme-preset-label";

export default function LaunchDesignPage() {
  const t = useT();
  const { config, loading, updateConfig, saveDraft, resetToSaved, saving, isDirty, tenantId } =
    useDashboard();
  const { getError } = useFieldValidation(config ?? null);

  if (loading || !config) return <p className="text-slate-400">{t("dashboard.design.loading")}</p>;

  const miniApp = config.miniApp ?? createDefaultMiniApp(config.slug);
  const overrides = config.theme.overrides ?? {};
  const tokens = resolveTheme(config);

  function updateMiniApp(patch: Partial<MiniAppConfig>) {
    updateConfig((prev) => ({
      ...prev,
      miniApp: { ...(prev.miniApp ?? createDefaultMiniApp(prev.slug)), ...patch },
    }));
  }

  function selectPack(pack: VisualPack) {
    updateMiniApp({ visualPack: pack });
  }

  return (
    <div className="space-y-6">
      <SectionCard title={t("dashboard.launch.visualPackTitle")}>
        <div className="grid gap-4 sm:grid-cols-2">
          {REFERENCE_VISUAL_PACKS.map((pack) => (
            <VisualPackCard
              key={pack}
              pack={pack}
              selected={miniApp.visualPack === pack}
              onSelect={() => selectPack(pack)}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title={t("dashboard.design.themePreset")}>
        <div className="grid gap-3 sm:grid-cols-2">
          {THEME_PRESET_OPTIONS.map((option) => (
            <ThemePresetCard
              key={option.value}
              preset={option.value}
              label={getThemePresetLabel(option.value, t)}
              selected={config.theme.preset === option.value}
              onSelect={() =>
                updateConfig((prev) => ({
                  ...prev,
                  theme: { ...prev.theme, preset: option.value },
                }))
              }
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title={t("dashboard.design.miniAppSettings")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t("dashboard.launch.publicSlug")}
            value={miniApp.publicSlug}
            onChange={(e) => updateMiniApp({ publicSlug: e.target.value })}
            error={getError("miniApp.publicSlug")}
          />
          <Select
            label={t("dashboard.launch.defaultTopic")}
            value={miniApp.defaultTopic ?? ""}
            options={[
              { value: "", label: t("dashboard.launch.noneSelected") },
              ...FUNNEL_TOPICS.map((topic) => ({ value: topic, label: topic })),
            ]}
            onChange={(e) =>
              updateMiniApp({
                defaultTopic: (e.target.value || null) as FunnelTopic | null,
              })
            }
          />
        </div>
      </SectionCard>

      <SectionCard title={t("dashboard.design.colorOverrides")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorInput
            label={t("dashboard.design.primaryColor")}
            value={overrides.primaryColor ?? tokens.primary}
            onChange={(v) =>
              updateConfig((prev) => ({
                ...prev,
                theme: {
                  ...prev.theme,
                  overrides: { ...prev.theme.overrides, primaryColor: v || undefined },
                },
              }))
            }
            error={getError("theme.overrides.primaryColor")}
          />
          <ColorInput
            label={t("dashboard.design.accentColor")}
            value={overrides.accentColor ?? tokens.accent}
            onChange={(v) =>
              updateConfig((prev) => ({
                ...prev,
                theme: {
                  ...prev.theme,
                  overrides: { ...prev.theme.overrides, accentColor: v || undefined },
                },
              }))
            }
            error={getError("theme.overrides.accentColor")}
          />
        </div>
      </SectionCard>

      <FormActions onSave={saveDraft} onReset={resetToSaved} saving={saving} isDirty={isDirty} />
    </div>
  );
}
