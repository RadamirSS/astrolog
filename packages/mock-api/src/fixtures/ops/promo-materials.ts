import type { PromoMaterial } from "@astro/api-contracts";
import { getPartnersForTenant } from "./partners";

const CTAS = {
  free: "Получить бесплатный мини-разбор",
  relationships: "Разобрать мой код отношений",
  money: "Узнать свой денежный код",
  main: "Открыть личный астрологический портрет",
  personality: "Получить личностный портрет",
};

function partnerLink(slug: string, topic?: string): string {
  if (!topic) return `/b/${slug}`;
  return `/b/${slug}/${topic}`;
}

export function getPromoMaterialsForTenant(
  tenantId: string,
  partnerId?: string
): PromoMaterial[] {
  const partners = getPartnersForTenant(tenantId).filter(
    (p) => !partnerId || p.id === partnerId
  );
  const materials: PromoMaterial[] = [];

  for (const partner of partners) {
    materials.push(
      {
        id: `promo_${partner.id}_story_general`,
        tenantId,
        partnerId: partner.id,
        partnerSlug: partner.slug,
        visualPack: "sky_clarity",
        type: "story_text",
        title: "Story — общий лендинг",
        body: `✨ Хочешь понять себя глубже через астрологию?\n\nЯ собрала для вас персональный мини-разбор — бесплатно и без обязательств. Это мягкий первый шаг к пониманию ваших сильных сторон.\n\n${CTAS.free}`,
        url: partnerLink(partner.slug),
      },
      {
        id: `promo_${partner.id}_post_money`,
        tenantId,
        partnerId: partner.id,
        partnerSlug: partner.slug,
        productType: "low_ticket_money",
        topic: "money",
        visualPack: "dark_gold_mystic",
        type: "post_text",
        title: "Post — денежный код",
        body: `Деньги — это не только цифры. Это сценарии, которые мы проживаем.\n\nДенежный код покажет ваши ресурсные паттерны и точки роста — без фатализма и «100% предсказаний».\n\n${CTAS.money}`,
        url: partnerLink(partner.slug, "money"),
      },
      {
        id: `promo_${partner.id}_post_relationships`,
        tenantId,
        partnerId: partner.id,
        partnerSlug: partner.slug,
        productType: "low_ticket_relationships",
        topic: "relationships",
        visualPack: "pink_love",
        type: "post_text",
        title: "Post — код отношений",
        body: `Почему мы притягиваем определённых людей? Что ищем в близости?\n\nКод отношений — персональный разбор ваших паттернов в любви и партнёрстве.\n\n${CTAS.relationships}`,
        url: partnerLink(partner.slug, "relationships"),
      },
      {
        id: `promo_${partner.id}_cta_personality`,
        tenantId,
        partnerId: partner.id,
        partnerSlug: partner.slug,
        productType: "low_ticket_personality",
        topic: "personality",
        visualPack: "cosmic_pastel",
        type: "cta",
        title: "CTA — личностный портрет",
        body: CTAS.personality,
        url: partnerLink(partner.slug, "personality"),
      },
      {
        id: `promo_${partner.id}_link_main`,
        tenantId,
        partnerId: partner.id,
        partnerSlug: partner.slug,
        productType: "main_natal_portrait",
        visualPack: "dark_gold_mystic",
        type: "link",
        title: "Link — полный портрет",
        body: CTAS.main,
        url: partnerLink(partner.slug),
      },
      {
        id: `promo_${partner.id}_qr`,
        tenantId,
        partnerId: partner.id,
        partnerSlug: partner.slug,
        visualPack: partner.defaultVisualPack,
        type: "qr_placeholder",
        title: "QR placeholder",
        body: `QR-код для ${partner.name} — генерация медиа в следующих пакетах.`,
        url: partnerLink(partner.slug),
      }
    );
  }

  return materials;
}

export function buildPartnerLinks(partnerSlug: string, baseUrl?: string) {
  const prefix = baseUrl ? baseUrl.replace(/\/$/, "") : "";
  const paths = {
    general: `/b/${partnerSlug}`,
    money: `/b/${partnerSlug}/money`,
    relationships: `/b/${partnerSlug}/relationships`,
    personality: `/b/${partnerSlug}/personality`,
  };
  return {
    ...paths,
    generalFull: prefix ? `${prefix}${paths.general}` : paths.general,
    moneyFull: prefix ? `${prefix}${paths.money}` : paths.money,
    relationshipsFull: prefix ? `${prefix}${paths.relationships}` : paths.relationships,
    personalityFull: prefix ? `${prefix}${paths.personality}` : paths.personality,
  };
}
