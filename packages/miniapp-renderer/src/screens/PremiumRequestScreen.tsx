"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createPremiumRequest } from "@astro/api-client";
import type { PremiumContactMethod, PremiumTopic } from "@astro/api-contracts";
import { useT } from "@astro/i18n";
import { Button, LoadingState, PageShell } from "@astro/ui";
import { useMiniApp, useMiniAppNav } from "../context";
import { useMiniAppAnalytics } from "../useAnalytics";

const TOPICS: PremiumTopic[] = [
  "money",
  "relationships",
  "personality",
  "full_portrait",
  "other",
];

const CONTACT_METHODS: PremiumContactMethod[] = ["telegram", "email", "phone", "whatsapp"];

export function PremiumRequestScreen() {
  const { config, birthProfile, userId, productId } = useMiniApp();
  const nav = useMiniAppNav();
  const { track } = useMiniAppAnalytics();
  const t = useT();
  const searchParams = useSearchParams();
  const resolvedProductId = searchParams.get("productId") ?? productId ?? undefined;

  const product = useMemo(
    () => config.products.find((p) => p.id === resolvedProductId && p.level === "premium"),
    [config.products, resolvedProductId]
  );

  const [topic, setTopic] = useState<PremiumTopic>(birthProfile?.topic ?? "relationships");
  const [personalQuestion, setPersonalQuestion] = useState("");
  const [context, setContext] = useState("");
  const [contactMethod, setContactMethod] = useState<PremiumContactMethod>("telegram");
  const [contactValue, setContactValue] = useState("");
  const [desiredWindow, setDesiredWindow] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!product || !consent || personalQuestion.trim().length < 3) return;
    setLoading(true);
    setError(null);
    track("premium_request_started", { productId: product.id });
    try {
      const created = await createPremiumRequest({
        tenantId: config.tenantId,
        tenantSlug: config.slug,
        userId,
        productId: product.id,
        productType: product.productType,
        topic,
        personalQuestion: personalQuestion.trim(),
        context: context.trim() || undefined,
        contactMethod: contactValue.trim() ? contactMethod : undefined,
        contactValue: contactValue.trim() || undefined,
        desiredWindow: desiredWindow.trim() || undefined,
        consentAccepted: true,
        birthProfile: birthProfile
          ? {
              name: birthProfile.name,
              birthDate: birthProfile.birthDate,
              birthTime: birthProfile.birthTime,
              timeAccuracy: birthProfile.timeAccuracy ?? "unknown",
              birthPlace: birthProfile.birthPlace,
              topic: birthProfile.topic,
            }
          : undefined,
      });
      track("premium_request_submitted", { requestId: created.id, productId: product.id });
      nav.goPremiumStatus(created.id);
    } catch {
      setError(t("miniapp.premium.submitError"));
    } finally {
      setLoading(false);
    }
  }

  if (!product) {
    return (
      <PageShell title={t("miniapp.premium.requestTitle")}>
        <p className="text-sm text-[var(--color-text-muted)]">{t("miniapp.productDetail.notFoundDesc")}</p>
        <Button className="mt-4" onClick={nav.goProducts}>
          {t("miniapp.productDetail.backToOfferings")}
        </Button>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={t("miniapp.premium.requestTitle")}
      subtitle={t("miniapp.premium.requestSubtitle")}
    >
      <div className="flex flex-col gap-4 min-w-0 overflow-x-hidden pb-24">
        {birthProfile?.timeAccuracy === "unknown" && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {t("miniapp.premium.birthTimeUnknown")}
          </p>
        )}
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-text-muted)]">{t("miniapp.premium.topic")}</span>
          <select
            className="rounded-lg border px-3 py-2 bg-[var(--color-surface)]"
            value={topic}
            onChange={(e) => setTopic(e.target.value as PremiumTopic)}
          >
            {TOPICS.map((tp) => (
              <option key={tp} value={tp}>
                {t(`miniapp.premium.topics.${tp}` as "miniapp.premium.topics.money")}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-text-muted)]">{t("miniapp.premium.personalQuestion")}</span>
          <textarea
            className="min-h-[88px] rounded-lg border px-3 py-2 bg-[var(--color-surface)]"
            value={personalQuestion}
            onChange={(e) => setPersonalQuestion(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-text-muted)]">{t("miniapp.premium.context")}</span>
          <textarea
            className="min-h-[64px] rounded-lg border px-3 py-2 bg-[var(--color-surface)]"
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-text-muted)]">{t("miniapp.premium.contactMethod")}</span>
          <select
            className="rounded-lg border px-3 py-2 bg-[var(--color-surface)]"
            value={contactMethod}
            onChange={(e) => setContactMethod(e.target.value as PremiumContactMethod)}
          >
            {CONTACT_METHODS.map((method) => (
              <option key={method} value={method}>
                {t(`miniapp.premium.contactMethods.${method}` as "miniapp.premium.contactMethods.telegram")}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-text-muted)]">{t("miniapp.premium.contactValue")}</span>
          <input
            className="rounded-lg border px-3 py-2 bg-[var(--color-surface)]"
            value={contactValue}
            onChange={(e) => setContactValue(e.target.value)}
            placeholder="@username"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--color-text-muted)]">{t("miniapp.premium.desiredWindow")}</span>
          <input
            className="rounded-lg border px-3 py-2 bg-[var(--color-surface)]"
            value={desiredWindow}
            onChange={(e) => setDesiredWindow(e.target.value)}
          />
        </label>
        <label className="flex items-start gap-2 text-xs text-[var(--color-text-muted)]">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>{t("miniapp.premium.consent")}</span>
        </label>
        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        <Button
          fullWidth
          onClick={() => void handleSubmit()}
          disabled={loading || !consent || personalQuestion.trim().length < 3}
        >
          {loading ? t("miniapp.premium.submitting") : t("miniapp.premium.submit")}
        </Button>
        <Button variant="ghost" fullWidth onClick={() => nav.goProductDetail(product.id)}>
          {t("miniapp.premium.backToProduct")}
        </Button>
      </div>
    </PageShell>
  );
}
