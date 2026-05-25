import { z } from "zod";

export const dashboardMetricsPeriodSchema = z.enum(["7d", "30d"]);

export const dashboardMetricsConversionSchema = z.object({
  visitToProfile: z.number(),
  profileToReport: z.number(),
  reportToProductClick: z.number(),
});

export const dashboardMetricsSchema = z.object({
  period: dashboardMetricsPeriodSchema,
  visits: z.number().int().min(0),
  onboardingStarts: z.number().int().min(0),
  birthProfilesSubmitted: z.number().int().min(0),
  freeReportsRequested: z.number().int().min(0),
  freeReportsViewed: z.number().int().min(0),
  productClicks: z.number().int().min(0),
  productCtaClicks: z.number().int().min(0),
  reportsGenerated: z.number().int().min(0),
  reportFailures: z.number().int().min(0),
  conversion: dashboardMetricsConversionSchema,
});

export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>;
export type DashboardMetricsPeriod = z.infer<typeof dashboardMetricsPeriodSchema>;
