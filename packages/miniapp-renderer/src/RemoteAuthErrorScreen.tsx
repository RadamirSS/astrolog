"use client";

import { useT } from "@astro/i18n";
import { Card, PageShell } from "@astro/ui";
import { useMiniApp } from "./context";

export function RemoteAuthErrorScreen() {
  const { authError } = useMiniApp();
  const t = useT();

  if (!authError) return null;

  return (
    <PageShell title={t("miniapp.shell.authErrorTitle")}>
      <Card className="border-red-500/30 bg-red-500/10">
        <p className="text-sm text-red-200">{authError}</p>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">
          {t("miniapp.shell.authErrorHint")}
        </p>
      </Card>
    </PageShell>
  );
}
