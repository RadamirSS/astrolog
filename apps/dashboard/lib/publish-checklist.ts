import type { SetupProgress, TenantConfig, TenantConfigStatus } from "@astro/tenant-config";
import { getSetupProgress } from "@astro/tenant-config";

export interface PublishChecklistItem {
  id: string;
  label: string;
  done: boolean;
  required?: boolean;
}

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export function getPublishChecklistItems(
  config: TenantConfig,
  setup: SetupProgress,
  status: TenantConfigStatus | null,
  isDirty: boolean,
  t: TranslateFn
): PublishChecklistItem[] {
  return [
    {
      id: "brand",
      label: t("dashboard.publishChecklist.brandConfigured"),
      done: setup.brandAdded,
      required: true,
    },
    {
      id: "design",
      label: t("dashboard.publishChecklist.themeSelected"),
      done: setup.designSelected,
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
      label: t("dashboard.publishChecklist.freeReport", { defaultValue: "Free report enabled" }),
      done: setup.hasFreeReportActive,
      required: true,
    },
    {
      id: "paidProduct",
      label: t("dashboard.publishChecklist.paidProduct", {
        defaultValue: "At least one paid product active",
      }),
      done: setup.hasPaidProductActive,
      required: true,
    },
    {
      id: "publicSlug",
      label: t("dashboard.publishChecklist.publicSlug", { defaultValue: "Public slug configured" }),
      done: setup.miniAppSlugConfigured,
      required: true,
    },
    {
      id: "visualPack",
      label: t("dashboard.publishChecklist.visualPack", { defaultValue: "Visual pack selected" }),
      done: setup.visualPackSelected,
      required: true,
    },
    {
      id: "products",
      label: t("dashboard.publishChecklist.activeProduct"),
      done: setup.hasActiveProduct,
      required: false,
    },
    {
      id: "saved",
      label: t("dashboard.publishChecklist.savedLocally"),
      done: !isDirty,
      required: true,
    },
    {
      id: "changes",
      label: status?.hasUnpublishedChanges
        ? t("dashboard.publishChecklist.readyToPublish")
        : publishedOrFirst(config, status, t),
      done: status?.hasUnpublishedChanges ?? !status?.publishedVersion,
      required: false,
    },
  ];
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
