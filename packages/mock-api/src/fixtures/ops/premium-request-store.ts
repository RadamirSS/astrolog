import type {
  CreatePremiumRequestInput,
  PremiumRequest,
  PremiumRequestStatus,
  UpdatePremiumRequestAdminInput,
} from "@astro/api-contracts";
import { MOCK_PREMIUM_REQUESTS } from "./premium-requests-seed";

const requests = new Map<string, PremiumRequest>();
const byUserKey = new Map<string, Set<string>>();

function userKey(userId?: string, sessionId?: string): string | null {
  return userId ?? sessionId ?? null;
}

function indexRequest(req: PremiumRequest): void {
  const key = userKey(req.userId, req.sessionId);
  if (!key) return;
  const set = byUserKey.get(key) ?? new Set();
  set.add(req.id);
  byUserKey.set(key, set);
}

function initFromSeed(): void {
  if (requests.size > 0) return;
  for (const req of MOCK_PREMIUM_REQUESTS) {
    requests.set(req.id, { ...req });
    indexRequest(req);
  }
}

export function ensurePremiumRequestStore(): void {
  initFromSeed();
}

export function listPremiumRequestsForTenant(
  tenantId: string,
  filters?: { status?: PremiumRequestStatus; topic?: string }
): PremiumRequest[] {
  ensurePremiumRequestStore();
  return Array.from(requests.values())
    .filter((r) => r.tenantId === tenantId)
    .filter((r) => (filters?.status ? r.status === filters.status : true))
    .filter((r) => (filters?.topic ? r.topic === filters.topic : true))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function listPremiumRequestsForUser(options: {
  tenantId: string;
  userId?: string;
  sessionId?: string;
}): PremiumRequest[] {
  ensurePremiumRequestStore();
  const key = userKey(options.userId, options.sessionId);
  if (!key) return [];
  const ids = byUserKey.get(key);
  if (!ids) return [];
  return Array.from(ids)
    .map((id) => requests.get(id))
    .filter((r): r is PremiumRequest => Boolean(r && r.tenantId === options.tenantId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getPremiumRequestById(id: string): PremiumRequest | undefined {
  ensurePremiumRequestStore();
  return requests.get(id);
}

export function createPremiumRequestRecord(
  input: CreatePremiumRequestInput & { userId?: string; sessionId?: string }
): PremiumRequest {
  ensurePremiumRequestStore();
  const now = new Date().toISOString();
  const id = `pr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const req: PremiumRequest = {
    id,
    tenantId: input.tenantId,
    userId: input.userId,
    sessionId: input.sessionId,
    productId: input.productId,
    productType: input.productType,
    productTitle: input.productTitle ?? "Premium-разбор",
    status: "submitted",
    topic: input.topic,
    personalQuestion: input.personalQuestion,
    context: input.context,
    contactMethod: input.contactMethod,
    contactValue: input.contactValue,
    desiredWindow: input.desiredWindow,
    consentAccepted: input.consentAccepted,
    birthProfile: input.birthProfile,
    createdAt: now,
    updatedAt: now,
    submittedAt: now,
    timeline: [{ at: now, status: "submitted", note: "Заявка отправлена" }],
  };
  requests.set(id, req);
  indexRequest(req);
  return req;
}

export function updatePremiumRequestAdmin(
  tenantId: string,
  requestId: string,
  update: UpdatePremiumRequestAdminInput
): PremiumRequest | null {
  ensurePremiumRequestStore();
  const existing = requests.get(requestId);
  if (!existing || existing.tenantId !== tenantId) return null;
  const now = new Date().toISOString();
  const timeline = [...(existing.timeline ?? [])];
  if (update.status) {
    timeline.push({ at: now, status: update.status, actor: "admin" });
  }
  const adminNotes = [...(existing.adminNotes ?? [])];
  if (update.adminNote) adminNotes.push(update.adminNote);
  const next: PremiumRequest = {
    ...existing,
    status: update.status ?? existing.status,
    assignedExpert: update.assignedExpert ?? existing.assignedExpert,
    finalPdfUrl:
      update.finalPdfUrl !== undefined ? update.finalPdfUrl : existing.finalPdfUrl,
    adminNotes,
    timeline,
    updatedAt: now,
  };
  requests.set(requestId, next);
  return next;
}
