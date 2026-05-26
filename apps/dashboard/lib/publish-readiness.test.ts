import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDefaultTenantConfig } from "@astro/tenant-config";
import {
  ensureSurfaces,
  setSurfaceEnabled,
} from "@astro/tenant-config";
import { getDictionary, t } from "@astro/i18n";
import { getPublishReadiness } from "./publish-readiness.js";
import { translateValidationErrors } from "./validation-messages.js";

const ru = getDictionary("ru");

describe("publish-readiness", () => {
  it("returns blocked tier when validation fails", () => {
    const config = createDefaultTenantConfig("t1", "", "");
    const readiness = getPublishReadiness(config);
    assert.equal(readiness.tier, "blocked");
    assert.equal(readiness.canPublish, false);
    assert.ok(readiness.blockers.length > 0);
  });

  it("does not require telegram when telegram disabled", () => {
    const config = createDefaultTenantConfig("t1", "valid-slug", "Valid Name");
    const readiness = getPublishReadiness(config);
    const telegramBlockers = readiness.blockers.filter((e) => e.path.includes("telegram"));
    assert.equal(telegramBlockers.length, 0);
  });

  it("requires telegram bot when telegram enabled", () => {
    let config = createDefaultTenantConfig("t1", "valid-slug", "Valid Name");
    config = {
      ...config,
      miniApp: setSurfaceEnabled(
        ensureSurfaces(config.miniApp, "valid-slug"),
        "telegram_mini_app",
        true
      ),
    };
    const readiness = getPublishReadiness(config);
    assert.ok(readiness.blockers.some((e) => e.path.includes("telegram")));
  });

  it("returns attention tier when draft is dirty", () => {
    const config = createDefaultTenantConfig("t1", "valid-slug", "Valid Name");
    const readiness = getPublishReadiness(config, { isDirty: true });
    assert.equal(readiness.tier, "attention");
    assert.equal(readiness.canPublish, false);
  });

  it("surfaces block lists enabled website and mobile", () => {
    const config = createDefaultTenantConfig("t1", "valid-slug", "Valid Name");
    const readiness = getPublishReadiness(config);
    const website = readiness.surfaces.find((s) => s.id === "website");
    const mobile = readiness.surfaces.find((s) => s.id === "mobile");
    assert.equal(website?.enabled, true);
    assert.equal(mobile?.enabled, true);
  });

  it("blockers translate to RU messages", () => {
    const config = createDefaultTenantConfig("t1", "", "");
    const readiness = getPublishReadiness(config);
    const messages = translateValidationErrors(readiness.blockers, (key) => t(ru, key));
    assert.ok(messages.length > 0);
    for (const message of messages) {
      assert.ok(!/^(Public slug|Mini app name)/.test(message));
    }
  });
});
