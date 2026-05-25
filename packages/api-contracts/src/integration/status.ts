import type { IntegrationModuleStatus } from "@astro/tenant-config";
import { z } from "zod";

export const integrationStatusValueSchema = z.enum([
  "not_configured",
  "coming_later",
  "mock_only",
  "active",
  "error",
]);

export const integrationStatusesSchema = z.object({
  telegram: integrationStatusValueSchema,
  payments: integrationStatusValueSchema,
  analytics: integrationStatusValueSchema,
  backendApi: integrationStatusValueSchema,
  reportGeneration: integrationStatusValueSchema,
});

export interface IntegrationStatuses {
  telegram: IntegrationModuleStatus;
  payments: IntegrationModuleStatus;
  analytics: IntegrationModuleStatus;
  backendApi: IntegrationModuleStatus;
  reportGeneration: IntegrationModuleStatus;
}

export function defaultIntegrationStatuses(
  apiMode: "mock" | "remote" = "mock"
): IntegrationStatuses {
  return {
    telegram: "not_configured",
    payments: apiMode === "mock" ? "mock_only" : "not_configured",
    analytics: "not_configured",
    backendApi: apiMode === "mock" ? "mock_only" : "not_configured",
    reportGeneration: "mock_only",
  };
}

export function countActiveProducts(
  products: Array<{ status: string }>
): number {
  return products.filter((p) => p.status === "active").length;
}

export function countEnabledModules(modules: {
  onboarding: boolean;
  freeReport: boolean;
  products: boolean;
  profile: boolean;
}): number {
  return [modules.onboarding, modules.freeReport, modules.products, modules.profile].filter(
    Boolean
  ).length;
}
