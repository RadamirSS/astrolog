import type { BirthProfile, BirthProfileTopic, Report } from "@astro/tenant-config";
import { z } from "zod";

export interface FreeReportRequest {
  tenantSlug?: string;
  tenantId?: string;
  birthProfile?: BirthProfile;
  topic?: BirthProfileTopic;
  userId?: string;
}

export interface ReportListItem {
  id: string;
  type: Report["type"];
  title: string;
  generatedAt: string;
}

export interface ListReportsQuery {
  tenantId?: string;
  userId?: string;
}

export type { Report };

export type ReportLifecycleStatus = "pending" | "generating" | "completed" | "failed";

export interface ReportStatusResponse {
  id: string;
  status: ReportLifecycleStatus;
  reportType: string;
  locale: string;
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  completedAt?: string | null;
  report?: Report | null;
}

export const reportListItemSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["free", "natal", "compatibility", "forecast", "custom"]),
  title: z.string().min(1),
  generatedAt: z.string(),
});

export const reportListSchema = z.array(reportListItemSchema);

export const reportStatusResponseSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["pending", "generating", "completed", "failed"]),
  reportType: z.string().min(1),
  locale: z.string().min(1),
  errorCode: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  createdAt: z.string(),
  completedAt: z.string().nullable().optional(),
  report: z.unknown().nullable().optional(),
});
