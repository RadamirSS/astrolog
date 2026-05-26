import type { SetupProgress, TenantConfig, TenantConfigStatus } from "@astro/tenant-config";
import {
  ensureSurfaces,
  getSetupProgress,
  getSurfaceByType,
  isSurfaceEnabled,
} from "@astro/tenant-config";
import { PUBLISH_CHECKLIST_HREFS } from "./publish-readiness";

export interface PublishChecklistItem {
  id: string;
  label: string;
  done: boolean;
  required?: boolean;
  href?: string;
}

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export function getPublishChecklistItems(
  config: TenantConfig,
  setup: SetupProgress,
  status: TenantConfigStatus | null,
  isDirty: boolean,
  t: TranslateFn
): PublishChecklistItem[] {
  const miniApp = ensureSurfaces(config.miniApp, config.slug);
  const websiteEnabled = isSurfaceEnabled(miniApp, "website");
  const mobileEnabled = isSurfaceEnabled(miniApp, "mobile_web");
  const telegramEnabled = isSurfaceEnabled(miniApp, "telegram_mini_app");
  const tgSurface = getSurfaceByType(miniApp, "telegram_mini_app");
  const tgConfig = tgSurface?.configJson as { botStatus?: string } | undefined;
  const telegramConnected =
    tgConfig?.botStatus === "connected" || tgConfig?.botStatus === "webhook_configured";

  const items: PublishChecklistItem[] = [
    {
      id: "brand",
      label: t("dashboard.launch.checklistName"),
      done: setup.brandAdded,
      required: true,
    },
    {
      id: "design",
      label: t("dashboard.launch.checklistDesign"),
      done: setup.designSelected && setup.visualPackSelected,
      required: true,
    },
    {
      id: "content",
      label: t("dashboard.publishChecklist.contentSet"),
      done: setup.mainTextConfigured,
      required: true,
    },
    {
      id: "freeReport",
      label: t("dashboard.publishChecklist.freeReport"),
      done: setup.hasFreeReportActive,
      required: true,
    },
    {
      id: "paidProduct",
      label: t("dashboard.publishChecklist.paidProduct"),
      done: setup.hasPaidProductActive,
      required: true,
    },
    {
      id: "publicSlug",
      label: t("dashboard.publishChecklist.publicSlug"),
      done: setup.miniAppSlugConfigured,
      required: true,
    },
    {
      id: "products",
      label: t("dashboard.launch.checklistProducts"),
      done: setup.hasFreeReportActive && setup.hasPaidProductActive,
      required: true,
    },
  ];

  if (websiteEnabled) {
    items.push({
      id: "website",
      label: t("dashboard.publishChecklist.websiteReady"),
      done: setup.miniAppSlugConfigured,
      required: true,
    });
  }

  if (mobileEnabled) {
    items.push({
      id: "mobile",
      label: t("dashboard.publishChecklist.mobileReady"),
      done: setup.miniAppSlugConfigured,
      required: true,
    });
  }

  if (telegramEnabled) {
    items.push({
      id: "telegram",
      label: t("dashboard.publishChecklist.telegramBot"),
      done: telegramConnected,
      required: true,
    });
  }

  items.push(
    {
      id: "saved",
      label: t("dashboard.publishChecklist.savedLocally"),
      done: !isDirty,
      required: true,
    },
    {
      id: "published",
      label: t("dashboard.publishChecklist.miniAppPublished"),
      done: config.miniApp?.publicStatus === "published",
      required: false,
    },
    {
      id: "changes",
      label: status?.hasUnpublishedChanges
        ? t("dashboard.publishChecklist.readyToPublish")
        : publishedOrFirst(config, status, t),
      done: status?.hasUnpublishedChanges ?? !status?.publishedVersion,
      required: false,
    }
  );

  return items.map((item) => ({
    ...item,
    href: PUBLISH_CHECKLIST_HREFS[item.id],
  }));
}

function publishedOrFirst(
  config: TenantConfig,
  status: TenantConfigStatus | null,
  t: TranslateFn
): string {
  if (!status?.publishedVersion) return t("dashboard.publishChecklist.firstPublish");
  return t("dashboard.publishChecklist.noChanges");
}

export function getSetupProgressForConfig(config: TenantConfig): SetupProgress {
  return getSetupProgress(config);
}
