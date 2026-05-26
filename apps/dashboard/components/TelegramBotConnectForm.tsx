"use client";

import { useCallback, useEffect, useState } from "react";
import {
  connectTelegramBot,
  disconnectTelegramBot,
  getTelegramIntegrationStatus,
} from "@astro/api-client";
import { Badge, Button, Input, SectionCard } from "@astro/ui";
import { useT } from "@astro/i18n";

interface TelegramIntegrationStatus {
  integrationId: string;
  tenantId: string;
  botUsername?: string;
  botDisplayName?: string;
  status: string;
  webhookStatus?: string;
  menuStatus?: string;
  miniAppUrl?: string;
  deepLink?: string;
  lastValidatedAt?: string;
  errorMessage?: string;
}

interface TelegramBotConnectFormProps {
  tenantId: string;
  onConnected?: (status: TelegramIntegrationStatus) => void;
  onDisconnected?: () => void;
}

function mapTelegramError(message: string, t: ReturnType<typeof useT>): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid") || lower.includes("token")) {
    return t("dashboard.launch.telegramErrorInvalid");
  }
  if (lower.includes("storage") || lower.includes("encrypt")) {
    return t("dashboard.launch.telegramErrorStorage");
  }
  if (lower.includes("already") || lower.includes("taken")) {
    return t("dashboard.launch.telegramErrorTaken");
  }
  if (lower.includes("webhook") || lower.includes("menu")) {
    return t("dashboard.launch.telegramErrorWebhook");
  }
  if (lower.includes("unavailable") || lower.includes("network")) {
    return t("dashboard.launch.telegramErrorUnavailable");
  }
  return message;
}

export function TelegramBotConnectForm({
  tenantId,
  onConnected,
  onDisconnected,
}: TelegramBotConnectFormProps) {
  const t = useT();
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<TelegramIntegrationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const current = await getTelegramIntegrationStatus(tenantId);
      setStatus(current);
    } catch {
      setStatus(null);
    }
  }, [tenantId]);

  useEffect(() => {
    void (async () => {
      setInitialLoading(true);
      await loadStatus();
      setInitialLoading(false);
    })();
  }, [loadStatus]);

  async function handleConnect() {
    setLoading(true);
    setError(null);
    try {
      const result = await connectTelegramBot(tenantId, token);
      setStatus(result);
      setToken("");
      onConnected?.(result);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Connection failed";
      setError(mapTelegramError(raw, t));
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    setError(null);
    try {
      const result = await disconnectTelegramBot(tenantId, status?.integrationId);
      setStatus(result);
      onDisconnected?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Disconnect failed");
    } finally {
      setLoading(false);
    }
  }

  async function copyTelegramLink() {
    const link = status?.deepLink ?? status?.miniAppUrl;
    if (link && typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(link);
    }
  }

  const connected = Boolean(status?.botUsername);

  function webhookLabel(): string {
    if (status?.status === "mock" || status?.webhookStatus === "mock") {
      return t("dashboard.launch.telegramMockMode");
    }
    if (
      status?.status === "webhook_configured" ||
      status?.webhookStatus === "configured" ||
      status?.webhookStatus === "ready"
    ) {
      return t("dashboard.launch.telegramWebhookReady");
    }
    if (status?.webhookStatus === "error" || status?.status === "error") {
      return t("dashboard.launch.telegramWebhookError");
    }
    return t("dashboard.launch.telegramWebhookNeedsCheck");
  }

  const instructionSteps = [
    t("dashboard.launch.telegramStep1"),
    t("dashboard.launch.telegramStep2"),
    t("dashboard.launch.telegramStep3"),
    t("dashboard.launch.telegramStep4"),
    t("dashboard.launch.telegramStep5"),
  ];

  return (
    <SectionCard title={t("dashboard.launch.telegramTitle")} description={t("dashboard.launch.telegramDesc")}>
      {initialLoading ? (
        <p className="text-sm text-slate-400">{t("common.loading")}</p>
      ) : connected ? (
        <div className="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <p className="text-lg font-medium text-emerald-300">{t("dashboard.launch.telegramConnected")}</p>
          <div className="space-y-1 text-sm text-slate-300">
            <p>
              @{status?.botUsername}
              {status?.botDisplayName ? ` · ${status.botDisplayName}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">{t("dashboard.launch.telegramTokenVerified")}</Badge>
            {status?.miniAppUrl && (
              <Badge variant="info">{t("dashboard.launch.telegramMiniAppReady")}</Badge>
            )}
            <Badge variant="neutral">{webhookLabel()}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2 text-sm text-sky-300 hover:bg-slate-800"
            >
              {t("dashboard.launch.telegramOpenBotFather")}
            </a>
            <Button type="button" variant="secondary" onClick={() => void copyTelegramLink()}>
              {t("dashboard.launch.telegramCopyLink")}
            </Button>
            <Button type="button" variant="secondary" onClick={handleDisconnect} disabled={loading}>
              {t("dashboard.launch.telegramDisconnect")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => void loadStatus()} disabled={loading}>
              {t("dashboard.launch.telegramRefreshStatus")}
            </Button>
          </div>
          <p className="text-xs text-slate-500">{t("dashboard.launch.telegramSecurityNote")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <ol className="space-y-3 text-sm text-slate-300">
              {instructionSteps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-600/30 text-xs font-semibold text-violet-200">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center justify-center rounded-lg border border-sky-500/30 bg-sky-950/40 px-4 py-2.5 text-sm text-sky-300 hover:bg-sky-900/40"
            >
              {t("dashboard.launch.telegramOpenBotFather")}
            </a>
          </div>
          <Input
            label={t("dashboard.launch.telegramTokenLabel")}
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={t("dashboard.launch.telegramTokenPlaceholder")}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleConnect} disabled={loading || !token.trim()}>
              {t("dashboard.launch.telegramConnect")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setHelpOpen((v) => !v)}>
              {t("dashboard.launch.telegramWhereToken")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => void loadStatus()} disabled={loading}>
              {t("dashboard.launch.telegramRefreshStatus")}
            </Button>
          </div>
          {helpOpen && (
            <p className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-400">
              {t("dashboard.launch.telegramWhereTokenHelp")}
            </p>
          )}
          <p className="text-xs text-slate-500">{t("dashboard.launch.telegramSecurityNote")}</p>
        </div>
      )}
    </SectionCard>
  );
}
