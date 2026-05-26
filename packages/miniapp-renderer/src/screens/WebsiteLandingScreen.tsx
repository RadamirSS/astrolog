"use client";

import type { TenantConfig } from "@astro/tenant-config";
import { FUNNEL_TOPICS, getFunnelTopicLabel, getLandingVisualPack } from "@astro/tenant-config";
import { useI18n, useT } from "@astro/i18n";
import { VisualPackScope } from "@astro/theme-engine";
import {
  AstroHero,
  FaqAccordion,
  PageShell,
  ProductCard,
  SectionHeader,
  TopicCard,
} from "@astro/ui";

interface WebsiteLandingScreenProps {
  config: TenantConfig;
  slug: string;
  previewMode?: boolean;
  layout?: "mobile" | "desktop";
  onPreviewTopic?: (topic: string) => void;
  onPreviewProduct?: (productId: string) => void;
}

const DEFAULT_FAQ_KEYS = [
  { q: "miniapp.landing.faqForecast", a: "miniapp.landing.faqForecastAnswer" },
  { q: "miniapp.landing.faqBirthTime", a: "miniapp.landing.faqBirthTimeAnswer" },
  { q: "miniapp.landing.faqDelivery", a: "miniapp.landing.faqDeliveryAnswer" },
] as const;

export function WebsiteLandingScreen({
  config,
  slug,
  previewMode = false,
  layout = "mobile",
  onPreviewTopic,
  onPreviewProduct,
}: WebsiteLandingScreenProps) {
  const { locale } = useI18n();
  const t = useT();
  const { home } = config.content;
  const { brand } = config;
  const landingPack = config.miniApp?.visualPack ?? getLandingVisualPack();
  const activeProducts = config.products.filter((p) => p.status === "active");
  const isDesktop = layout === "desktop";

  function navigateTopic(topic: string) {
    if (previewMode && onPreviewTopic) {
      onPreviewTopic(topic);
      return;
    }
    window.location.href = `/b/${slug}/${topic}`;
  }

  function navigateProduct(productId: string) {
    if (previewMode && onPreviewProduct) {
      onPreviewProduct(productId);
      return;
    }
    window.location.href = `/${config.slug}/products/${productId}`;
  }

  const faqItems =
    home.faqItems && home.faqItems.length > 0
      ? home.faqItems
      : DEFAULT_FAQ_KEYS.map((item) => ({
          question: t(item.q),
          answer: t(item.a),
        }));

  const howItWorksSteps = [
    { title: t("miniapp.landing.step1Title"), desc: t("miniapp.landing.step1Desc") },
    { title: t("miniapp.landing.step2Title"), desc: t("miniapp.landing.step2Desc") },
    { title: t("miniapp.landing.step3Title"), desc: t("miniapp.landing.step3Desc") },
    { title: t("miniapp.landing.step4Title"), desc: t("miniapp.landing.step4Desc") },
  ];

  return (
    <div className="min-h-full bg-[var(--color-bg)]">
      <div className={`mx-auto px-4 py-8 ${isDesktop ? "max-w-5xl" : "max-w-3xl"}`}>
        <PageShell>
          <header className={`mb-6 ${isDesktop ? "text-left" : "text-center"}`}>
            <div className={`flex items-center gap-4 ${isDesktop ? "flex-row" : "flex-col"}`}>
              {brand.avatarUrl && (
                <img
                  src={brand.avatarUrl}
                  alt={brand.displayName}
                  className={`rounded-full object-cover ring-2 ring-[var(--color-primary)] ${
                    isDesktop ? "h-20 w-20" : "mx-auto mb-3 h-16 w-16"
                  }`}
                />
              )}
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">{brand.displayName}</p>
                {brand.bio && (
                  <p className={`mt-1 text-xs text-[var(--color-text-muted)] ${isDesktop ? "max-w-xl" : "mx-auto max-w-lg"}`}>
                    {brand.bio}
                  </p>
                )}
              </div>
            </div>
          </header>

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

          <section className="mt-8">
            <SectionHeader title={t("miniapp.home.chooseTopic")} />
            <div className={`mt-3 grid gap-3 ${isDesktop ? "sm:grid-cols-3" : "sm:grid-cols-3"}`}>
              {FUNNEL_TOPICS.map((topic) => (
                <TopicCard
                  key={topic}
                  topic={topic}
                  label={getFunnelTopicLabel(topic, locale)}
                  description={t(`miniapp.topics.${topic}Desc`)}
                  ctaLabel={t("miniapp.home.topicCta")}
                  onSelect={() => navigateTopic(topic)}
                />
              ))}
            </div>
          </section>

          <section className="mt-8">
            <SectionHeader title={config.content.productsIntro ?? t("miniapp.nav.shop")} />
            <div className={`mt-3 grid gap-3 ${isDesktop ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}>
              {activeProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDetail={() => navigateProduct(product.id)}
                />
              ))}
            </div>
          </section>

          <section className="mt-8">
            <SectionHeader title={t("miniapp.landing.howItWorks")} />
            <div className={`mt-3 grid gap-3 ${isDesktop ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2"}`}>
              {howItWorksSteps.map((step) => (
                <div
                  key={step.title}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-4 text-center"
                >
                  <p className="text-sm font-medium text-[var(--color-text)]">{step.title}</p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">{step.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-6 text-center">
            <p className={`font-medium text-[var(--color-text)] ${isDesktop ? "text-lg" : "text-sm"}`}>
              {home.ctaLabel}
            </p>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              {t("miniapp.home.clarityTagline")}
            </p>
          </section>

          <section className="mt-8">
            <SectionHeader title={t("miniapp.landing.trustTitle")} />
            <div className="mt-3">
              <FaqAccordion items={faqItems} />
            </div>
          </section>

          <footer className="mt-8 border-t border-[var(--color-border)] pt-4 text-center text-[10px] text-[var(--color-text-muted)]">
            {brand.displayName} · {t("dashboard.launch.websiteFooter")}
          </footer>
        </PageShell>
      </div>
    </div>
  );
}
