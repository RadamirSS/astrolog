import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDefaultTenantConfig } from "@astro/tenant-config";
import {
  ensureSurfaces,
  setSurfaceEnabled,
} from "@astro/tenant-config";
import {
  buildLaunchProgressSteps,
  getLaunchProgressPercent,
} from "./launch-progress.js";

describe("launch-progress", () => {
  it("includes surfaces step as first item", () => {
    const config = createDefaultTenantConfig("t1", "slug", "Name");
    const steps = buildLaunchProgressSteps(config);
    assert.equal(steps[0]?.id, "surfaces");
    assert.equal(steps[0]?.labelKey, "dashboard.launch.progressSurfaces");
  });

  it("omits telegram step when telegram disabled", () => {
    const config = createDefaultTenantConfig("t1", "slug", "Name");
    const steps = buildLaunchProgressSteps(config);
    assert.ok(!steps.some((s) => s.id === "telegram"));
  });

  it("includes telegram step when telegram enabled", () => {
    let config = createDefaultTenantConfig("t1", "slug", "Name");
    config = {
      ...config,
      miniApp: setSurfaceEnabled(
        ensureSurfaces(config.miniApp, "slug"),
        "telegram_mini_app",
        true
      ),
    };
    const steps = buildLaunchProgressSteps(config);
    assert.ok(steps.some((s) => s.id === "telegram"));
  });

  it("computes progress percent from done steps", () => {
    const config = createDefaultTenantConfig("t1", "slug", "Name");
    const steps = buildLaunchProgressSteps(config);
    const pct = getLaunchProgressPercent(steps);
    assert.ok(pct >= 0 && pct <= 100);
  });

  it("website and mobile enabled by default, telegram disabled", () => {
    const config = createDefaultTenantConfig("t1", "slug", "Name");
    const miniApp = ensureSurfaces(config.miniApp, config.slug);
    const website = miniApp.surfaces?.find((s) => s.type === "website");
    const mobile = miniApp.surfaces?.find((s) => s.type === "mobile_web");
    const telegram = miniApp.surfaces?.find((s) => s.type === "telegram_mini_app");
    assert.notEqual(website?.status, "disabled");
    assert.notEqual(mobile?.status, "disabled");
    assert.equal(telegram?.status, "disabled");
  });
});
