"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPaymentReturn } from "@astro/api-client";
import { useT } from "@astro/i18n";
import { Button, LoadingState, PageShell } from "@astro/ui";
import { useMiniApp, useMiniAppNav } from "../context";
import { useMiniAppAnalytics } from "../useAnalytics";

interface PaymentReturnScreenProps {
  returnState: "success" | "cancel" | "pending" | "failed";
}

export function PaymentReturnScreen({ returnState }: PaymentReturnScreenProps) {
  const { config, userId } = useMiniApp();
  const nav = useMiniAppNav();
  const { track } = useMiniAppAnalytics();
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError(t("miniapp.payment.missingOrder"));
      setLoading(false);
      return;
    }

    const eventName =
      returnState === "success"
        ? "payment_return_success"
        : returnState === "cancel"
          ? "payment_return_cancel"
          : returnState === "pending"
            ? "payment_return_pending"
            : "payment_return_failed";
    track(eventName, { orderId });

    confirmPaymentReturn(orderId, { orderId, returnState })
      .then((result) => {
        setMessage(result.message ?? null);
        if (returnState === "success" && result.orderStatus === "paid") {
          track("payment_paid", { orderId });
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : t("miniapp.payment.verifyError"));
      })
      .finally(() => setLoading(false));
  }, [orderId, returnState, track, t]);

  if (loading) {
    return (
      <PageShell title={t("miniapp.payment.title")}>
        <LoadingState message={t("miniapp.payment.verifying")} />
      </PageShell>
    );
  }

  const titleKey =
    returnState === "success"
      ? "miniapp.payment.successTitle"
      : returnState === "pending"
        ? "miniapp.payment.pendingTitle"
        : returnState === "failed"
          ? "miniapp.payment.failedTitle"
          : "miniapp.payment.cancelTitle";

  const defaultMessageKey =
    returnState === "success"
      ? "miniapp.payment.successMessage"
      : returnState === "pending"
        ? "miniapp.payment.pendingMessage"
        : returnState === "failed"
          ? "miniapp.payment.failedMessage"
          : "miniapp.payment.cancelMessage";

  return (
    <PageShell title={t(titleKey)}>
      <p className="text-center text-sm text-[var(--color-text-muted)]">
        {error ?? message ?? t(defaultMessageKey)}
      </p>
      <div className="mt-6 flex flex-col gap-2">
        {returnState === "success" && (
          <Button fullWidth onClick={nav.goReports}>
            {t("miniapp.payment.goToReports")}
          </Button>
        )}
        {(returnState === "cancel" || returnState === "failed") && (
          <Button fullWidth onClick={nav.goProducts}>
            {t("miniapp.payment.backToProducts")}
          </Button>
        )}
        {returnState === "pending" && (
          <Button fullWidth onClick={() => router.refresh()}>
            {t("miniapp.payment.refreshStatus")}
          </Button>
        )}
        <Button variant="ghost" fullWidth onClick={nav.goHome}>
          {t("miniapp.loading.returnHome")}
        </Button>
      </div>
    </PageShell>
  );
}
