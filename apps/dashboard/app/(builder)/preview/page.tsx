"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { MiniAppScreen } from "@astro/miniapp-renderer";
import { Badge, Button, LoadingState, SectionCard } from "@astro/ui";
import { useT } from "@astro/i18n";
import { useDashboard } from "../../components/DashboardProvider";
import { CompactPreview } from "../../../components/CompactPreview";
import { useDashboardAnalytics } from "../../../lib/useDashboardAnalytics";

export default function PreviewPage() {
  const t = useT();
  const searchParams = useSearchParams();
  const {
    config,
    publishedConfig,
    loading,
    hasUnpublishedChanges,
    tenantId,
  } = useDashboard();
  const track = useDashboardAnalytics(tenantId, config?.slug);
  const initialSource = searchParams.get("source") === "published" ? "published" : "draft";
  const [previewSource, setPreviewSource] = useState<"draft" | "published">(initialSource);
  const [screen, setScreen] = useState<MiniAppScreen>("home");
  const [previewProductId, setPreviewProductId] = useState<string | undefined>();

  const previewConfig = useMemo(() => {
    if (previewSource === "published") return publishedConfig;
    return config;
  }, [previewSource, config, publishedConfig]);

  useEffect(() => {
    if (config) track("dashboard_preview_opened", { screen });
  }, [config, track, screen]);

  if (loading || !config) {
    return <LoadingState message={t("dashboard.preview.loading")} className="text-slate-400" />;
  }

  const miniappUrl = process.env.NEXT_PUBLIC_MINIAPP_URL ?? "http://localhost:3000";
  const canPreviewPublished = publishedConfig != null;
  const publicSlug = config.miniApp?.publicSlug ?? config.slug;
  const partnerLinks = {
    general: `${miniappUrl}/b/${publicSlug}`,
    money: `${miniappUrl}/b/${publicSlug}/money`,
    relationships: `${miniappUrl}/b/${publicSlug}/relationships`,
    personality: `${miniappUrl}/b/${publicSlug}/personality`,
  };

  async function copyLink(link: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(link);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("dashboard.preview.title")}</h1>
        <p className="text-slate-400">{t("dashboard.preview.subtitle")}</p>
      </div>

      {previewSource === "draft" && (
        <div className="rounded-lg border border-amber-800/50 bg-amber-950/30 px-4 py-2 text-sm text-amber-200">
          {t("dashboard.preview.draftBanner")}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPreviewSource("draft")}
          className={`rounded-lg px-4 py-2 text-sm ${
            previewSource === "draft"
              ? "bg-violet-600 text-white"
              : "border border-slate-700 text-slate-300 hover:bg-slate-800"
          }`}
        >
          {t("dashboard.preview.yourChanges")}
        </button>
        <button
          type="button"
          disabled={!canPreviewPublished}
          onClick={() => setPreviewSource("published")}
          className={`rounded-lg px-4 py-2 text-sm disabled:opacity-40 ${
            previewSource === "published"
              ? "bg-violet-600 text-white"
              : "border border-slate-700 text-slate-300 hover:bg-slate-800"
          }`}
        >
          {t("dashboard.preview.liveInApp")}
        </button>
        {hasUnpublishedChanges && previewSource === "draft" && (
          <Badge variant="warning">{t("dashboard.preview.notLiveYet")}</Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title={t("dashboard.preview.embeddedPreview")}>
          {previewConfig ? (
            <CompactPreview
              config={previewConfig}
              screen={screen}
              showScreenPicker
              onScreenChange={setScreen}
              previewProductId={previewProductId}
              onProductChange={setPreviewProductId}
              previewSource={previewSource}
              height={640}
            />
          ) : (
            <p className="text-sm text-slate-400">{t("dashboard.preview.noPublished")}</p>
          )}
        </SectionCard>
        <SectionCard title={t("dashboard.preview.miniAppLinks")}>
          <div className="space-y-4 text-sm">
            <div>
              <p className="mb-2 text-slate-400">{t("dashboard.preview.draftConfig")}</p>
              <code className="block rounded bg-slate-800 p-3 text-violet-300">
                {miniappUrl}/{config.slug}?preview=draft
              </code>
              <a
                href={`${miniappUrl}/${config.slug}?preview=draft`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-violet-400 hover:underline"
              >
                {t("dashboard.preview.openDraft")}
              </a>
            </div>
            <div>
              <p className="mb-2 text-slate-400">{t("dashboard.preview.publishedConfig")}</p>
              {canPreviewPublished ? (
                <>
                  <code className="block rounded bg-slate-800 p-3 text-violet-300">
                    {miniappUrl}/{config.slug}
                  </code>
                  <a
                    href={`${miniappUrl}/${config.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-violet-400 hover:underline"
                  >
                    {t("dashboard.preview.openPublished")}
                  </a>
                </>
              ) : (
                <p className="text-slate-500">{t("dashboard.preview.notPublished")}</p>
              )}
            </div>
            <a
              href={`/publish?tenantId=${tenantId}`}
              className="inline-block text-violet-400 hover:underline"
            >
              {t("dashboard.preview.goToPublish")}
            </a>
            <div className="border-t border-slate-700 pt-4">
              <p className="mb-2 font-medium text-slate-200">
                {t("dashboard.preview.publicPartnerLinks", { defaultValue: "Public partner links" })}
              </p>
              {(
                [
                  ["general", partnerLinks.general],
                  ["money", partnerLinks.money],
                  ["relationships", partnerLinks.relationships],
                  ["personality", partnerLinks.personality],
                ] as const
              ).map(([key, link]) => (
                <div key={key} className="mb-3">
                  <code className="block rounded bg-slate-800 p-2 text-xs text-violet-300">{link}</code>
                  <div className="mt-1 flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => void copyLink(link)}>
                      {t("dashboard.preview.copyLink", { defaultValue: "Copy" })}
                    </Button>
                    <a
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-violet-400 hover:underline"
                    >
                      {t("dashboard.preview.openLink", { defaultValue: "Open" })}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
