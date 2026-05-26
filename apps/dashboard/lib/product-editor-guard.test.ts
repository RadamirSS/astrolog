import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const dashboardRoot = join(testDir, "..");
const builderRoot = join(dashboardRoot, "app/(builder)");

function readPage(relativePath: string): string {
  return readFileSync(join(builderRoot, relativePath), "utf8");
}

function listFilesRecursive(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...listFilesRecursive(full));
    } else if (/\.(tsx|ts)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

describe("product editor guard", () => {
  it("ProductEditor is not imported in creator launch routes or overview", () => {
    const launchDir = join(builderRoot, "launch");
    const overviewPage = readPage("overview/page.tsx");
    assert.doesNotMatch(overviewPage, /ProductEditor/);

    for (const file of listFilesRecursive(launchDir)) {
      const source = readFileSync(file, "utf8");
      assert.doesNotMatch(source, /ProductEditor/);
    }
  });

  it("launch products page uses approved catalog toggles only", () => {
    const source = readPage("launch/products/page.tsx");
    assert.match(source, /REAL_PRODUCT_CATALOG/);
    assert.match(source, /REAL_PRODUCT_TYPES/);
    assert.match(source, /syncCatalogProducts/);
    assert.doesNotMatch(source, /ProductEditor/);
    assert.doesNotMatch(source, /addOffering/);
  });

  it("launch products page shows read-only catalog prices", () => {
    const source = readPage("launch/products/page.tsx");
    assert.match(source, /priceLabel/);
    assert.doesNotMatch(source, /onUpdate.*price/i);
    assert.doesNotMatch(source, /Input.*price/i);
  });

  it("ProductEditor file is marked legacy admin-only", () => {
    const source = readFileSync(join(dashboardRoot, "components/ProductEditor.tsx"), "utf8");
    assert.match(source, /Legacy platform-admin-only product editor/);
    assert.match(source, /do not mount for creator roles/i);
    assert.match(source, /REAL_PRODUCT_CATALOG/);
  });
});
