"use client";

import { FUNNEL_TOPICS, getFunnelTopicLabel, getLandingVisualPack } from "@astro/tenant-config";
import type { FunnelTopic } from "@astro/tenant-config";
import { useI18n, useT } from "@astro/i18n";
import { VisualPackScope } from "@astro/theme-engine";
import {
  AstroHero,
  Card,
  FaqAccordion,
  PageShell,
  SectionHeader,
  TopicCard,
} from "@astro/ui";
import { useMiniApp, useMiniAppNav } from "../context";
import { useMiniAppAnalytics, useTrackOnce } from "../useAnalytics";

export function HomeScreen() {
  const { config, setSelectedTopic } = useMiniApp();
  const nav = useMiniAppNav();
  const { track } = useMiniAppAnalytics();
  const { locale } = useI18n();
  const t = useT();
  const { home } = config.content;
  const { brand } = config;
  const landingPack = getLandingVisualPack();

  useTrackOnce("landing_viewed");
  useTrackOnce("tenant_home_viewed");

  function handleTopicSelect(topic: FunnelTopic) {
    setSelectedTopic(topic);
    track("topic_selected", { topic });
    nav.goOnboarding(topic);
  }

  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <VisualPackScope pack={landingPack}>
          <AstroHero
            pack={landingPack}
            eyebrow={t("miniapp.home.eyebrow")}
            title={home.headline}
            subtitle={home.subheadline ?? t("miniapp.home.clarityTagline")}
            logoUrl={brand.logoUrl}
            logoAlt={brand.displayName}
          />
        </VisualPackScope>

        <p className="text-center text-sm text-[var(--color-text-muted)]">
          {t("miniapp.home.pocketAstrology")}
        </p>

        <section>
          <SectionHeader title={t("miniapp.home.chooseTopic")} />
          <div className="mt-3 flex flex-col gap-3">
            {FUNNEL_TOPICS.map((topic) => (
              <TopicCard
                key={topic}
                topic={topic}
                label={getFunnelTopicLabel(topic, locale)}
                description={t(`miniapp.topics.${topic}Desc`)}
                ctaLabel={t("miniapp.home.topicCta")}
                onSelect={() => handleTopicSelect(topic)}
              />
            ))}
          </div>
        </section>

        {home.whatYouReceive && home.whatYouReceive.length > 0 && (
          <section>
            <SectionHeader title={t("miniapp.home.whatYouReceive")} />
            <div className="mt-3 flex flex-col gap-3">
              {home.whatYouReceive.map((item) => (
                <Card key={item.id}>
                  <h3 className="font-semibold text-[var(--color-text)]">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-muted)]">
                    {item.text}
                  </p>
                </Card>
              ))}
            </div>
          </section>
        )}

        {home.faqItems && home.faqItems.length > 0 && (
          <section>
            <SectionHeader title={t("miniapp.home.faq")} />
            <div className="mt-3">
              <FaqAccordion items={home.faqItems} />
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}
