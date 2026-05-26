"use client";

import { useT } from "@astro/i18n";

interface MobileWebPreviewBannerProps {
  installableHintEnabled?: boolean;
}

export function MobileWebPreviewBanner({
  installableHintEnabled = true,
}: MobileWebPreviewBannerProps) {
  const t = useT();
  return (
    <div className="border-b border-violet-500/20 bg-violet-950/40 px-3 py-2.5 text-center">
      <p className="text-[11px] font-semibold text-violet-100">
        {t("dashboard.launch.previewMobileContext")}
      </p>
      <p className="mt-0.5 text-[10px] text-violet-300/90">
        {t("dashboard.launch.previewMobileBrowserNote")}
      </p>
      {installableHintEnabled && (
        <p className="mt-1 text-[10px] text-violet-300/70">
          {t("dashboard.launch.previewMobileHint")}
        </p>
      )}
    </div>
  );
}
