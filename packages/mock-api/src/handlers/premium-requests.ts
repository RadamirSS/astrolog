import type {
  CreatePremiumRequestInput,
  PremiumRequest,
  PremiumRequestStatus,
  UpdatePremiumRequestAdminInput,
} from "@astro/api-contracts";
import {
  createPremiumRequestRecord,
  getPremiumRequestById,
  listPremiumRequestsForTenant,
  listPremiumRequestsForUser,
  updatePremiumRequestAdmin,
} from "../fixtures/ops/premium-request-store";
import { delay } from "../utils";

export async function mockListMyPremiumRequests(options: {
  tenantId: string;
  userId?: string;
  sessionId?: string;
}): Promise<PremiumRequest[]> {
  await delay(80);
  return listPremiumRequestsForUser(options);
}

export async function mockGetPremiumRequest(requestId: string): Promise<PremiumRequest | null> {
  await delay(60);
  return getPremiumRequestById(requestId) ?? null;
}

export async function mockCreatePremiumRequest(
  input: CreatePremiumRequestInput & { userId?: string; sessionId?: string }
): Promise<PremiumRequest> {
  await delay(120);
  return createPremiumRequestRecord(input);
}

export async function mockListPremiumRequestsForTenant(
  tenantId: string,
  filters?: { status?: PremiumRequestStatus; topic?: string }
): Promise<PremiumRequest[]> {
  await delay(100);
  return listPremiumRequestsForTenant(tenantId, filters);
}

export async function mockUpdatePremiumRequestAdmin(
  tenantId: string,
  requestId: string,
  update: UpdatePremiumRequestAdminInput
): Promise<PremiumRequest | null> {
  await delay(100);
  return updatePremiumRequestAdmin(tenantId, requestId, update);
}
