import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { t } from "./core.js";
import { getDictionary } from "./dictionaries/index.js";

describe("builder RU copy", () => {
  const ru = getDictionary("ru");

  it("Launch Studio heading is RU", () => {
    assert.equal(t(ru, "dashboard.launch.title"), "Студия запуска");
  });

  it("surface labels are RU", () => {
    assert.equal(t(ru, "dashboard.launch.surfaceWebsiteTitle"), "Сайт");
    assert.equal(t(ru, "dashboard.launch.surfaceMobileTitle"), "Мобильная web-версия");
    assert.equal(t(ru, "dashboard.launch.surfaceTelegramTitle"), "Telegram Mini App");
  });

  it("preview uses mobile web wording", () => {
    assert.equal(t(ru, "dashboard.preview.surfaceMobile"), "Мобильная web-версия");
    assert.equal(t(ru, "dashboard.preview.livePreview"), "Предпросмотр");
  });

  it("visual pack RU names match spec", () => {
    assert.equal(
      t(ru, "dashboard.launch.visualPackSkyClarity"),
      "Для лёгкого входа и широкой аудитории"
    );
    assert.equal(
      t(ru, "dashboard.launch.visualPackDarkGold"),
      "Для premium, денег и глубоких разборов"
    );
  });

  it("product display names exist for approved catalog", () => {
    assert.equal(t(ru, "dashboard.products.displayNames.free_report"), "Бесплатный мини-разбор");
    assert.equal(t(ru, "dashboard.products.displayNames.low_ticket_money"), "Денежный код");
  });

  it("control center hero copy is creator-focused", () => {
    assert.equal(t(ru, "dashboard.controlCenter.heroTitle"), "Мой астрологический продукт");
    assert.match(t(ru, "dashboard.controlCenter.subtitle"), /аудитории/);
  });

  it("builder navigation includes links and preview", () => {
    assert.equal(t(ru, "dashboard.layout.links"), "Ссылки");
    assert.equal(t(ru, "dashboard.layout.preview"), "Предпросмотр");
  });

  it("self-service and publish copy is RU-first", () => {
    assert.equal(t(ru, "dashboard.controlCenter.startHere"), "Начните здесь");
    assert.equal(t(ru, "dashboard.layout.premiumRequests"), "Заявки");
    assert.equal(t(ru, "dashboard.layout.promoMaterials"), "Материалы");
    assert.equal(t(ru, "dashboard.publish.readinessBlocked"), "Нельзя опубликовать");
    assert.equal(t(ru, "dashboard.launch.checklistPreview"), "Предпросмотр проверен");
  });
});
