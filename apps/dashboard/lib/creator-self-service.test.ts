import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDefaultTenantConfig } from "@astro/tenant-config";
import {
  ensureSurfaces,
  setSurfaceEnabled,
} from "@astro/tenant-config";
import {
  buildPublicLinks,
  buildSelfServiceChecklist,
  formatAllLinksText,
  resolveCreatorMainStatus,
  resolveNextBestAction,
} from "./creator-self-service.js";

describe("creator-self-service", () => {
  it("resolves not published status for fresh config", () => {
    const config = createDefaultTenantConfig("t1", "slug", "Name");
    assert.equal(resolveCreatorMainStatus(config), "not_published");
  });

  it("buildSelfServiceChecklist includes links to launch steps", () => {
    const config = createDefaultTenantConfig("t1", "slug", "Name");
    const items = buildSelfServiceChecklist(config, false);
    assert.ok(items.some((i) => i.id === "brand" && i.href === "launch/branding"));
    assert.ok(items.some((i) => i.id === "design" && i.href === "launch/design"));
    assert.ok(items.some((i) => i.id === "products" && i.href === "launch/products"));
    assert.ok(items.some((i) => i.id === "preview" && i.href === "preview"));
    assert.ok(items.every((i) => i.explanationKey.startsWith("dashboard.controlCenter.checklistExplain")));
  });

  it("omits telegram checklist when telegram disabled", () => {
    const config = createDefaultTenantConfig("t1", "slug", "Name");
    const items = buildSelfServiceChecklist(config);
    assert.ok(!items.some((i) => i.id === "telegram"));
  });

  it("includes telegram checklist when telegram enabled", () => {
    let config = createDefaultTenantConfig("t1", "slug", "Name");
    config = {
      ...config,
      miniApp: setSurfaceEnabled(
        ensureSurfaces(config.miniApp, "slug"),
        "telegram_mini_app",
        true
      ),
    };
    const items = buildSelfServiceChecklist(config);
    assert.ok(items.some((i) => i.id === "telegram" && i.href === "launch/telegram"));
  });

  it("marks preview checklist done when verified", () => {
    const config = createDefaultTenantConfig("t1", "slug", "Name");
    const items = buildSelfServiceChecklist(config, true);
    const preview = items.find((i) => i.id === "preview");
    assert.equal(preview?.state, "done");
  });

  it("resolveNextBestAction suggests publish when ready and preview verified", () => {
    const config = createDefaultTenantConfig("t1", "valid-slug", "Valid Name");
    config.brand.bio = "Астролог с 10-летним опытом";
    const action = resolveNextBestAction(config, { previewVerified: true });
    assert.equal(action.href, "launch/publish");
    assert.equal(action.labelKey, "dashboard.controlCenter.publish");
  });

  it("resolveNextBestAction suggests continue setup when not published", () => {
    const config = createDefaultTenantConfig("t1", "slug", "Name");
    const action = resolveNextBestAction(config);
    assert.match(action.href, /launch\//);
  });

  it("resolveNextBestAction suggests preview when ready but not verified", () => {
    const config = createDefaultTenantConfig("t1", "valid-slug", "Valid Name");
    config.brand.bio = "Астролог с 10-летним опытом";
    const action = resolveNextBestAction(config, { previewVerified: false });
    assert.equal(action.href, "preview");
  });

  it("buildPublicLinks includes website and mobile by default", () => {
    const config = createDefaultTenantConfig("t1", "slug", "Name");
    const links = buildPublicLinks(config, "https://example.com");
    assert.ok(links.some((l) => l.id === "website"));
    assert.ok(links.some((l) => l.id === "mobile"));
    assert.ok(!links.some((l) => l.id === "telegram"));
  });

  it("buildPublicLinks includes telegram only when enabled", () => {
    let config = createDefaultTenantConfig("t1", "slug", "Name");
    config = {
      ...config,
      miniApp: setSurfaceEnabled(
        ensureSurfaces(config.miniApp, "slug"),
        "telegram_mini_app",
        true
      ),
    };
    const links = buildPublicLinks(config, "https://example.com");
    assert.ok(links.some((l) => l.id === "telegram"));
  });

  it("formatAllLinksText joins labels and urls", () => {
    const text = formatAllLinksText(
      [
        { id: "website", labelKey: "dashboard.controlCenter.websiteLink", url: "https://a.test", status: "draft" },
      ],
      (key) => (key === "dashboard.controlCenter.websiteLink" ? "Сайт" : key)
    );
    assert.match(text, /Сайт: https:\/\/a\.test/);
  });
});
