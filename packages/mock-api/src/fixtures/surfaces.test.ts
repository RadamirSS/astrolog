import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  mockConnectTelegramBot,
  mockDisconnectTelegramBot,
  mockGetCreatorMiniApp,
  mockResetTelegramIntegrations,
  mockResolvePublicSurface,
  mockValidateTelegramBot,
} from "../handlers/creator.js";

describe("mock creator surfaces", () => {
  beforeEach(() => {
    mockResetTelegramIntegrations();
  });

  it("creator 1 mystic resolves public website surface", async () => {
    const surface = await mockResolvePublicSurface("website", "nicole");
    assert.equal(surface.slug, "nicole");
    assert.equal(surface.surfaceType, "website");
    assert.ok(surface.activeProducts.length >= 1);
    assert.equal("token" in surface, false);
  });

  it("telegram connect does not return token", async () => {
    const status = await mockConnectTelegramBot("tenant_mystic", "123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef");
    assert.ok(status.botUsername);
    assert.equal("token" in status, false);
    assert.equal("encryptedToken" in status, false);
  });

  it("invalid telegram token fails validation", async () => {
    const result = await mockValidateTelegramBot("tenant_mystic", "bad");
    assert.equal(result.valid, false);
  });

  it("disconnect clears integration", async () => {
    await mockConnectTelegramBot("tenant_mystic", "123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef");
    const disconnected = await mockDisconnectTelegramBot("tenant_mystic");
    assert.equal(disconnected.status, "disconnected");
  });

  it("creator mini app includes surfaces", async () => {
    const app = await mockGetCreatorMiniApp("tenant_mystic");
    assert.ok(app.surfaces.length >= 3);
  });
});
