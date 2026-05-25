import type { Entitlement, Order } from "@astro/api-contracts";
import { MOCK_ORDERS } from "./orders-seed";

const MOCK_PDF_BY_REPORT: Record<string, string> = {
  rpt_mock_001: "https://cdn.example.com/pilot/reports/rpt_mock_001.pdf",
  rpt_mock_002: "https://cdn.example.com/pilot/reports/rpt_mock_002.pdf",
  rpt_mock_004: "https://cdn.example.com/pilot/reports/rpt_mock_004.pdf",
  rpt_mock_011: "https://cdn.example.com/pilot/reports/rpt_mock_011.pdf",
  rpt_mock_013: "https://cdn.example.com/pilot/reports/rpt_mock_013.pdf",
  rpt_mock_rel_ready: "https://cdn.example.com/pilot/reports/rpt_mock_rel_ready.pdf",
};

const runtimeOrders = new Map<string, Order>();
const entitlements = new Map<string, Entitlement>();
const entitlementsByOrder = new Map<string, string>();
const entitlementsByUser = new Map<string, Set<string>>();
const orderBirthContext = new Map<
  string,
  {
    birth?: {
      name: string;
      birthDate: string;
      birthTime?: string | null;
      timeAccuracy: "exact" | "approximate" | "unknown";
      birthPlace: string;
    };
    locale?: string;
  }
>();

let orderCounter = 1000;

function initFromSeed(): void {
  if (runtimeOrders.size > 0) return;
  for (const order of MOCK_ORDERS) {
    const pdfUrl =
      order.reportStatus === "ready" && order.externalReportId
        ? MOCK_PDF_BY_REPORT[order.externalReportId] ?? null
        : null;
    runtimeOrders.set(order.id, { ...order, pdfUrl });
    if (order.entitlementId) {
      const ent: Entitlement = {
        id: order.entitlementId,
        tenantId: order.tenantId,
        userId: order.userId,
        sessionId: order.sessionId,
        orderId: order.id,
        productType: order.productType,
        reportId: order.externalReportId,
        pdfUrl: pdfUrl ?? null,
        status: mapReportToEntitlement(order),
        grantedAt: order.paidAt,
        createdAt: order.createdAt,
        updatedAt: order.paidAt ?? order.createdAt,
      };
      entitlements.set(ent.id, ent);
      entitlementsByOrder.set(order.id, ent.id);
      indexEntitlement(ent);
    }
  }
}

function mapReportToEntitlement(order: Order): Entitlement["status"] {
  if (order.entitlementStatus === "revoked") return "revoked";
  if (order.reportStatus === "ready") return "ready";
  if (order.reportStatus === "generating" || order.reportStatus === "queued") return "paid_generating";
  if (order.reportStatus === "failed") return "failed";
  if (order.status === "payment_pending") return "pending_payment";
  if (order.status === "paid") return "paid_generating";
  return "locked";
}

function indexEntitlement(ent: Entitlement): void {
  const key = ent.userId ?? ent.sessionId ?? ent.id;
  const set = entitlementsByUser.get(key) ?? new Set();
  set.add(ent.id);
  entitlementsByUser.set(key, set);
}

export function ensureOrderStore(): void {
  initFromSeed();
}

export function getAllOrders(): Order[] {
  ensureOrderStore();
  return Array.from(runtimeOrders.values());
}

export function getOrdersForTenant(tenantId: string): Order[] {
  return getAllOrders().filter((o) => o.tenantId === tenantId);
}

export function getOrderById(orderId: string): Order | undefined {
  ensureOrderStore();
  return runtimeOrders.get(orderId);
}

export function upsertOrder(order: Order): Order {
  ensureOrderStore();
  runtimeOrders.set(order.id, order);
  return order;
}

export function createOrderId(): string {
  orderCounter += 1;
  return `ord_${orderCounter}`;
}

export function createEntitlementId(): string {
  return `ent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getEntitlementById(id: string): Entitlement | undefined {
  ensureOrderStore();
  return entitlements.get(id);
}

export function getEntitlementByOrderId(orderId: string): Entitlement | undefined {
  ensureOrderStore();
  const id = entitlementsByOrder.get(orderId);
  return id ? entitlements.get(id) : undefined;
}

export function upsertEntitlement(ent: Entitlement): Entitlement {
  ensureOrderStore();
  entitlements.set(ent.id, ent);
  if (ent.orderId) entitlementsByOrder.set(ent.orderId, ent.id);
  indexEntitlement(ent);
  return ent;
}

export function getEntitlementsForUser(options: {
  tenantId: string;
  userId?: string;
  sessionId?: string;
}): Entitlement[] {
  ensureOrderStore();
  const key = options.userId ?? options.sessionId;
  if (!key) return [];
  const ids = entitlementsByUser.get(key);
  if (!ids) return [];
  return Array.from(ids)
    .map((id) => entitlements.get(id))
    .filter((e): e is Entitlement => Boolean(e && e.tenantId === options.tenantId));
}

export function setOrderBirthContext(
  orderId: string,
  context: {
    birth?: {
      name: string;
      birthDate: string;
      birthTime?: string | null;
      timeAccuracy: "exact" | "approximate" | "unknown";
      birthPlace: string;
    };
    locale?: string;
  }
): void {
  orderBirthContext.set(orderId, context);
}

export function getOrderBirthContext(orderId: string) {
  return orderBirthContext.get(orderId);
}

export function resetOrderStore(): void {
  runtimeOrders.clear();
  entitlements.clear();
  entitlementsByOrder.clear();
  entitlementsByUser.clear();
  orderBirthContext.clear();
  orderCounter = 1000;
  initFromSeed();
}
