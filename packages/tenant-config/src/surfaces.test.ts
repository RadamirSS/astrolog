import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSurfacePublicUrls,
  createDefaultSurfaces,
  ensureSurfaces,
  getEnabledSurfaces,
  setSurfaceEnabled,
} from "./surfaces.js";
import { validateMiniAppPublish } from "./validation.js";
import { createDefaultTenantConfig } from "./defaults.js";

describe("surfaces", () => {
  it("creates default surfaces for slug", () => {
    const surfaces = createDefaultSurfaces("nicole");
    assert.equal(surfaces.length, 3);
    assert.equal(surfaces[0]?.publicUrl, "/b/nicole");
    assert.equal(surfaces[1]?.publicUrl, "/s/nicole");
    assert.equal(surfaces[2]?.publicUrl, "/m/nicole");
    const telegram = surfaces.find((s) => s.type === "telegram_mini_app");
    const website = surfaces.find((s) => s.type === "website");
    const mobile = surfaces.find((s) => s.type === "mobile_web");
    assert.equal(telegram?.status, "disabled");
    assert.equal(website?.status, "draft");
    assert.equal(mobile?.status, "draft");
  });

  it("ensureSurfaces defaults telegram disabled and website/mobile enabled", () => {
    const migrated = ensureSurfaces(undefined, "demo");
    assert.equal(getEnabledSurfaces(migrated).length, 2);
    assert.ok(getEnabledSurfaces(migrated).some((s) => s.type === "website"));
    assert.ok(getEnabledSurfaces(migrated).some((s) => s.type === "mobile_web"));
  });

  it("ensureSurfaces migrates legacy miniApp config", () => {
    const legacy = {
      publicSlug: "nicole",
      visualPack: "pink_love" as const,
      defaultTopic: null,
      publicStatus: "draft" as const,
    };
    const migrated = ensureSurfaces(legacy, "nicole");
    assert.ok(migrated.surfaces && migrated.surfaces.length === 3);
  });

  it("setSurfaceEnabled toggles surface", () => {
    const miniApp = ensureSurfaces(undefined, "demo");
    const disabled = setSurfaceEnabled(miniApp, "website", false);
    const website = disabled.surfaces?.find((s) => s.type === "website");
    assert.equal(website?.status, "disabled");
    assert.equal(getEnabledSurfaces(disabled).length, 1);
  });

  it("buildSurfacePublicUrls supports base url", () => {
    const urls = buildSurfacePublicUrls("nicole", "https://app.example.com");
    assert.equal(urls.website, "https://app.example.com/s/nicole");
  });
});

describe("validateMiniAppPublish surfaces", () => {
  it("fails without enabled surfaces", () => {
    let config = createDefaultTenantConfig("t1", "slug", "Name");
    config = {
      ...config,
      miniApp: setSurfaceEnabled(ensureSurfaces(config.miniApp, "slug"), "telegram_mini_app", false),
    };
    config = {
      ...config,
      miniApp: setSurfaceEnabled(config.miniApp!, "website", false),
    };
    config = {
      ...config,
      miniApp: setSurfaceEnabled(config.miniApp!, "mobile_web", false),
    };
    const result = validateMiniAppPublish(config);
    assert.equal(result.valid, false);
  });

  it("fails telegram surface without connected bot when telegram enabled", () => {
    const config = createDefaultTenantConfig("t1", "slug", "Name");
    config.products = config.products.map((p) => ({ ...p, status: "active" as const }));
    config.miniApp = {
      ...setSurfaceEnabled(ensureSurfaces(config.miniApp, "slug"), "telegram_mini_app", true),
      visualPack: "cosmic_pastel",
    };
    const result = validateMiniAppPublish(config);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.path.includes("telegram")));
  });

  it("publish does not require bot when telegram disabled", () => {
    const config = createDefaultTenantConfig("t1", "slug", "Name");
    config.products = config.products.map((p) => ({ ...p, status: "active" as const }));
    config.brand.displayName = "Test App";
    config.content.home.headline = "Headline";
    config.content.home.subheadline = "Sub";
    config.content.home.ctaLabel = "Start";
    config.miniApp = {
      ...ensureSurfaces(config.miniApp, "slug"),
      visualPack: "cosmic_pastel",
      publicSlug: "slug",
    };
    const result = validateMiniAppPublish(config);
    assert.equal(result.valid, true);
  });
});
