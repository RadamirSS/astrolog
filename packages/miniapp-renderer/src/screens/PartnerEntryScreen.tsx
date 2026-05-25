"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiClientError, ApiErrorCode, resolvePublicPartner, trackSafeSync } from "@astro/api-client";
import {
  attributionAnalyticsProps,
  capturePartnerEntry,
  parsePartnerTopicSlug,
} from "../attribution";

interface PartnerEntryScreenProps {
  partnerSlug: string;
  topicSlug?: string;
}

export function PartnerEntryScreen({ partnerSlug, topicSlug }: PartnerEntryScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolveAndRedirect() {
      try {
        const partner = await resolvePublicPartner(partnerSlug);
        if (!partner || cancelled) {
          if (!cancelled) setUnavailable(true);
          return;
        }

        if (partner.status !== "published") {
          if (!cancelled) setUnavailable(true);
          return;
        }

        const parsedTopic = topicSlug ? parsePartnerTopicSlug(topicSlug) : null;
        const allowed = partner.allowedTopics ?? ["money", "relationships", "personality"];
        const topic =
          parsedTopic && allowed.includes(parsedTopic)
            ? parsedTopic
            : partner.defaultTopic && allowed.includes(partner.defaultTopic)
              ? partner.defaultTopic
              : null;

        const params = new URLSearchParams(searchParams.toString());

        const attribution = capturePartnerEntry(partnerSlug, {
          partnerId: partner.partnerId,
          params,
        });

        trackSafeSync(partner.tenantId, "partner_link_clicked", {
          tenantSlug: partner.tenantSlug,
          ...attributionAnalyticsProps(attribution),
          topic: topic ?? undefined,
        });

        if (topic) {
          router.replace(`/${partner.tenantSlug}/onboarding?topic=${topic}`);
        } else {
          router.replace(`/${partner.tenantSlug}`);
        }
      } catch (error) {
        if (cancelled) return;
        if (
          error instanceof ApiClientError &&
          (error.code === ApiErrorCode.NOT_FOUND ||
            error.code === ApiErrorCode.FORBIDDEN ||
            error.code === ApiErrorCode.TENANT_PAUSED)
        ) {
          setUnavailable(true);
          return;
        }
        setUnavailable(true);
      }
    }

    void resolveAndRedirect();
    return () => {
      cancelled = true;
    };
  }, [partnerSlug, topicSlug, router, searchParams]);

  if (unavailable) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-medium">Mini App unavailable</p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          This creator link is not published or is temporarily unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
    </div>
  );
}
