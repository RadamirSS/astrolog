"use client";

import type { TenantConfig } from "@astro/tenant-config";
import { getSetupProgress } from "@astro/tenant-config";
import { useT } from "@astro/i18n";
import { ChecklistItem, SectionCard } from "@astro/ui";

interface SetupChecklistProps {
  config: TenantConfig;
  tenantId: string;
}

export function SetupChecklist({ config, tenantId }: SetupChecklistProps) {
  const t = useT();
  const progress = getSetupProgress(config);
  const q = `?tenantId=${tenantId}`;

  return (
    <SectionCard
      title={t("dashboard.setup.checklistTitle")}
      description={t("dashboard.setup.checklistDesc")}
    >
      <div className="space-y-1">
        <ChecklistItem
          label={t("dashboard.setup.brandAdded")}
          done={progress.brandAdded}
          href={`/brand${q}`}
        />
        <ChecklistItem
          label={t("dashboard.setup.designSelected")}
          done={progress.designSelected}
          href={`/design${q}`}
        />
        <ChecklistItem
          label={t("dashboard.setup.mainTextConfigured")}
          done={progress.mainTextConfigured}
          href={`/content${q}`}
        />
        <ChecklistItem
          label={t("dashboard.setup.activeProduct")}
          done={progress.hasActiveProduct}
          href={`/products${q}`}
        />
        <ChecklistItem
          label={t("dashboard.setup.previewChecked")}
          done={progress.previewChecked}
          href={`/preview${q}`}
        />
      </div>
    </SectionCard>
  );
}
