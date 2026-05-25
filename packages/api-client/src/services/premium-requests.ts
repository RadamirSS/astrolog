import type {
  CreatePremiumRequestInput,
  PremiumRequest,
  PremiumRequestStatus,
  UpdatePremiumRequestAdminInput,
} from "@astro/api-contracts";
import {
  createPremiumRequestRecord,
  getPremiumRequestById,
  listPremiumRequestsForTenant as mockListPremiumRequestsForTenant,
  listPremiumRequestsForUser,
  updatePremiumRequestAdmin as mockUpdatePremiumRequestAdmin,
} from "@astro/mock-api";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listMyPremiumRequests(options: {
  tenantId: string;
  userId?: string;
  sessionId?: string;
}): Promise<PremiumRequest[]> {
  await delay(80);
  return listPremiumRequestsForUser(options);
}

export async function getPremiumRequest(requestId: string): Promise<PremiumRequest | null> {
  await delay(60);
  return getPremiumRequestById(requestId) ?? null;
}

export async function createPremiumRequest(
  input: CreatePremiumRequestInput & { userId?: string; sessionId?: string }
): Promise<PremiumRequest> {
  await delay(120);
  return createPremiumRequestRecord(input);
}

export async function listPremiumRequestsForTenant(
  tenantId: string,
  filters?: { status?: PremiumRequestStatus; topic?: string }
): Promise<PremiumRequest[]> {
  await delay(100);
  return mockListPremiumRequestsForTenant(tenantId, filters);
}

export async function updatePremiumRequestAdmin(
  tenantId: string,
  requestId: string,
  update: UpdatePremiumRequestAdminInput
): Promise<PremiumRequest | null> {
  await delay(100);
  return mockUpdatePremiumRequestAdmin(tenantId, requestId, update);
}
