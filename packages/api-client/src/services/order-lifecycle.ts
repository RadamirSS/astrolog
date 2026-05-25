import type {
  CheckoutOrderDetail,
  ConfirmPaymentReturnRequest,
  ConfirmPaymentReturnResponse,
  Entitlement,
  Order,
  ReportAccessCheck,
  StartCheckoutRequest,
  StartCheckoutResponse,
} from "@astro/api-contracts";
import {
  createEntitlementId,
  createOrderId,
  getEntitlementByOrderId,
  getEntitlementsForUser,
  getOrderBirthContext,
  getOrderById,
  setOrderBirthContext,
  upsertEntitlement,
  upsertOrder,
} from "@astro/mock-api";
import type { ReportV2 } from "@astro/tenant-config";
import { buildMockLibraryPaidReportV2 } from "@astro/tenant-config";
import { astroClient } from "../astro/client";
import { buildPaymentReturnUrls } from "../payment/config";
import { paymentClient } from "../payment/client";

const paidReports = new Map<string, ReportV2>();

function seedStaticMockPaidReports(): void {
  if (paidReports.size > 0) return;
  paidReports.set(
    "rpt_mock_rel_ready",
    buildMockLibraryPaidReportV2({
      reportId: "rpt_mock_rel_ready",
      productType: "low_ticket_relationships",
      theme: "relationships",
      locale: "ru",
      pdfUrl: "https://cdn.example.com/pilot/reports/rpt_mock_rel_ready.pdf",
    })
  );
  paidReports.set(
    "rpt_mock_revoked",
    buildMockLibraryPaidReportV2({
      reportId: "rpt_mock_revoked",
      productType: "low_ticket_relationships",
      theme: "relationships",
      locale: "ru",
      status: "ready",
      pdfUrl: null,
    })
  );
}

seedStaticMockPaidReports();

function nowIso(): string {
  return new Date().toISOString();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function triggerPaidReport(order: Order, ent: Entitlement): Promise<void> {
  const ctx = getOrderBirthContext(order.id);
  if (!ctx?.birth) return;
  const response = await astroClient.requestPaidReport({
    tenantId: order.tenantId,
    userId: order.userId,
    sessionId: order.sessionId,
    orderId: order.id,
    entitlementId: ent.id,
    productType: order.productType,
    theme: order.theme ?? null,
    locale: ctx.locale ?? "ru",
    birth: {
      name: ctx.birth.name,
      birthDate: ctx.birth.birthDate,
      birthTime: ctx.birth.birthTime ?? null,
      timeAccuracy: ctx.birth.timeAccuracy,
      birthPlace: ctx.birth.birthPlace,
    },
    partner: order.partnerId
      ? {
          partnerId: order.partnerId,
          partnerSlug: order.partnerSlug,
          campaignId: order.campaignId,
        }
      : undefined,
  });

  ent.reportId = response.reportId;
  ent.status = "paid_generating";
  ent.updatedAt = nowIso();
  upsertEntitlement(ent);
  upsertOrder({
    ...order,
    externalReportId: response.reportId,
    reportStatus: "queued",
    entitlementId: ent.id,
    entitlementStatus: "paid_generating",
    lastSyncAt: nowIso(),
  });

  void pollReportUntilDone(order.id, response.reportId);
}

async function pollReportUntilDone(
  orderId: string,
  reportId: string,
  attempt = 0
): Promise<void> {
  if (attempt > 20) return;
  await delay(500);
  try {
    const status = await astroClient.getReportStatus(reportId);
    const order = getOrderById(orderId);
    const ent = getEntitlementByOrderId(orderId);
    if (!order || !ent) return;

    if (status.status === "ready") {
      const report = await astroClient.getReportResult(reportId);
      paidReports.set(reportId, report);
      ent.status = "ready";
      ent.reportId = reportId;
      ent.pdfUrl = report.pdfUrl ?? null;
      ent.grantedAt = ent.grantedAt ?? nowIso();
      ent.updatedAt = nowIso();
      upsertEntitlement(ent);
      upsertOrder({
        ...order,
        reportStatus: "ready",
        reportProgress: 100,
        entitlementStatus: "ready",
        externalReportId: reportId,
        pdfUrl: report.pdfUrl ?? null,
        lastSyncAt: nowIso(),
      });
      return;
    }

    if (status.status === "failed") {
      ent.status = "failed";
      ent.updatedAt = nowIso();
      upsertEntitlement(ent);
      upsertOrder({
        ...order,
        reportStatus: "failed",
        reportErrorCode: status.errorCode ?? "report_generation_failed",
        reportErrorMessage: status.errorMessage ?? "Report generation failed.",
        entitlementStatus: "failed",
        lastSyncAt: nowIso(),
      });
      return;
    }

    upsertOrder({
      ...order,
      reportStatus: status.status === "processing" ? "generating" : "queued",
      reportProgress: status.progress ?? order.reportProgress ?? 0,
      lastSyncAt: nowIso(),
    });
    await pollReportUntilDone(orderId, reportId, attempt + 1);
  } catch {
    if (attempt < 20) {
      await pollReportUntilDone(orderId, reportId, attempt + 1);
    }
  }
}

export async function startCheckout(
  request: StartCheckoutRequest
): Promise<StartCheckoutResponse> {
  await delay(120);
  const { getCatalogDef } = await import("@astro/tenant-config");
  const catalog = getCatalogDef(request.productType);
  const productTitle = catalog.titleEn;
  const amount = catalog.price;
  const currency = "USD";

  const orderId = createOrderId();
  const entitlementId = createEntitlementId();
  const now = nowIso();
  const urls = buildPaymentReturnUrls(request.tenantSlug);

  const order: Order = {
    id: orderId,
    tenantId: request.tenantId,
    userId: request.userId,
    sessionId: request.sessionId,
    productType: request.productType,
    productTitle,
    theme: request.theme,
    amount,
    currency,
    status: "created",
    paymentStatus: "created",
    reportStatus: "locked",
    partnerId: request.partner?.partnerId,
    partnerSlug: request.partner?.partnerSlug,
    campaignId: request.partner?.campaignId,
    entitlementId,
    entitlementStatus: "pending_payment",
    createdAt: now,
  };

  upsertOrder(order);
  setOrderBirthContext(orderId, { birth: request.birth, locale: request.locale });

  const entitlement: Entitlement = {
    id: entitlementId,
    tenantId: request.tenantId,
    userId: request.userId,
    sessionId: request.sessionId,
    orderId,
    productType: request.productType,
    status: "pending_payment",
    createdAt: now,
    updatedAt: now,
  };
  upsertEntitlement(entitlement);

  const payment = await paymentClient.createPayment({
    orderId,
    tenantId: request.tenantId,
    userId: request.userId,
    sessionId: request.sessionId,
    productType: request.productType,
    productTitle,
    amount,
    currency,
    successUrl: urls.successUrl,
    cancelUrl: urls.cancelUrl,
    pendingUrl: urls.pendingUrl,
    metadata: {
      partnerId: request.partner?.partnerId ?? null,
      partnerSlug: request.partner?.partnerSlug ?? null,
      campaignId: request.partner?.campaignId ?? null,
      theme: request.theme,
      locale: request.locale,
    },
    tenantSlug: request.tenantSlug,
  });

  upsertOrder({
    ...order,
    status: "payment_pending",
    paymentStatus: "payment_pending",
    externalPaymentId: payment.paymentId,
    paymentUrl: payment.paymentUrl,
  });

  return {
    orderId,
    paymentId: payment.paymentId,
    paymentUrl: payment.paymentUrl,
    status: "payment_pending",
    entitlementId,
  };
}

export async function getCheckoutOrder(orderId: string): Promise<CheckoutOrderDetail | null> {
  await delay(80);
  const order = getOrderById(orderId);
  if (!order) return null;
  return {
    orderId: order.id,
    orderStatus: order.status,
    paymentStatus: order.paymentStatus,
    paymentUrl: order.paymentUrl,
    externalPaymentId: order.externalPaymentId,
    entitlementId: order.entitlementId,
    entitlementStatus: order.entitlementStatus,
    reportStatus: order.reportStatus,
    externalReportId: order.externalReportId,
  };
}

export async function confirmPaymentReturn(
  orderId: string,
  request: ConfirmPaymentReturnRequest
): Promise<ConfirmPaymentReturnResponse> {
  await delay(100);
  const order = getOrderById(orderId);
  if (!order) throw new Error(`Order not found: ${orderId}`);
  const ent = getEntitlementByOrderId(orderId);
  if (!ent) throw new Error(`Entitlement not found for order: ${orderId}`);

  if (request.returnState === "cancel") {
    upsertOrder({ ...order, status: "cancelled", paymentStatus: "cancelled" });
    ent.status = "locked";
    ent.updatedAt = nowIso();
    upsertEntitlement(ent);
    return {
      orderId,
      orderStatus: "cancelled",
      paymentStatus: "cancelled",
      entitlementStatus: "locked",
      message: "Платёж не был завершён. Вы можете попробовать ещё раз или вернуться к продукту.",
    };
  }

  if (request.returnState === "failed") {
    upsertOrder({ ...order, status: "failed", paymentStatus: "failed" });
    ent.status = "locked";
    ent.updatedAt = nowIso();
    upsertEntitlement(ent);
    return {
      orderId,
      orderStatus: "failed",
      paymentStatus: "failed",
      entitlementStatus: "locked",
      message: "Платёж не был завершён. Вы можете попробовать ещё раз или вернуться к продукту.",
    };
  }

  if (request.returnState === "pending") {
    return {
      orderId,
      orderStatus: order.status,
      paymentStatus: order.paymentStatus,
      entitlementStatus: ent.status,
      reportStatus: order.reportStatus,
      message: "Мы ожидаем подтверждение оплаты. Обычно это занимает немного времени.",
    };
  }

  if (order.externalPaymentId) {
    paymentClient._mockMarkPaid(order.externalPaymentId);
    const paymentStatus = await paymentClient.getPaymentStatus(order.externalPaymentId);
    if (paymentStatus.status !== "paid") {
      return {
        orderId,
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
        entitlementStatus: ent.status,
        message: "Мы ожидаем подтверждение оплаты. Обычно это занимает немного времени.",
      };
    }
  }

  const paidAt = nowIso();
  const updatedOrder = upsertOrder({
    ...order,
    status: "paid",
    paymentStatus: "paid",
    paidAt,
    reportStatus: "queued",
  });

  ent.status = "paid_generating";
  ent.grantedAt = paidAt;
  ent.updatedAt = paidAt;
  upsertEntitlement(ent);
  upsertOrder({
    ...updatedOrder,
    entitlementStatus: "paid_generating",
    lastSyncAt: paidAt,
  });

  void triggerPaidReport(updatedOrder, ent);

  return {
    orderId,
    orderStatus: "paid",
    paymentStatus: "paid",
    entitlementStatus: "paid_generating",
    reportStatus: "queued",
    message: "Оплата получена. Сейчас мы готовим ваш разбор.",
  };
}

export async function syncOrderPayment(
  tenantId: string,
  orderId: string
): Promise<Order | null> {
  await delay(100);
  const order = getOrderById(orderId);
  if (!order || order.tenantId !== tenantId) return null;
  if (!order.externalPaymentId) return order;

  const paymentStatus = await paymentClient
    .syncPaymentStatus(orderId)
    .catch(() => paymentClient.getPaymentStatus(order.externalPaymentId!));

  const ent = getEntitlementByOrderId(orderId);
  let updated = { ...order, lastSyncAt: nowIso() };

  if (paymentStatus.status === "paid" && order.status !== "paid") {
    updated = {
      ...updated,
      status: "paid",
      paymentStatus: "paid",
      paidAt: paymentStatus.paidAt ?? nowIso(),
      reportStatus: order.reportStatus === "locked" ? "queued" : order.reportStatus,
    };
    if (ent) {
      ent.status = "paid_generating";
      ent.grantedAt = updated.paidAt;
      ent.updatedAt = nowIso();
      upsertEntitlement(ent);
      void triggerPaidReport(updated, ent);
    }
  } else if (paymentStatus.status === "failed") {
    updated = { ...updated, status: "failed", paymentStatus: "failed" };
  } else if (paymentStatus.status === "cancelled") {
    updated = { ...updated, status: "cancelled", paymentStatus: "cancelled" };
  } else if (paymentStatus.status === "expired") {
    updated = { ...updated, status: "expired", paymentStatus: "expired" };
  } else {
    updated = { ...updated, paymentStatus: "payment_pending" };
  }

  return upsertOrder(updated);
}

export async function syncOrderReport(
  tenantId: string,
  orderId: string
): Promise<Order | null> {
  await delay(100);
  const order = getOrderById(orderId);
  if (!order || order.tenantId !== tenantId) return null;
  if (!order.externalReportId) return order;

  const status = await astroClient.getReportStatus(order.externalReportId);
  const ent = getEntitlementByOrderId(orderId);
  let updated: Order = {
    ...order,
    reportProgress: status.progress ?? order.reportProgress,
    reportErrorCode: status.errorCode ?? undefined,
    reportErrorMessage: status.errorMessage ?? undefined,
    lastSyncAt: nowIso(),
  };

  if (status.status === "ready") {
    const report = await astroClient.getReportResult(order.externalReportId);
    paidReports.set(order.externalReportId, report);
    updated = { ...updated, reportStatus: "ready", reportProgress: 100 };
    if (ent) {
      ent.status = "ready";
      ent.reportId = order.externalReportId;
      ent.updatedAt = nowIso();
      upsertEntitlement(ent);
      updated.entitlementStatus = "ready";
    }
  } else if (status.status === "failed") {
    updated = {
      ...updated,
      reportStatus: "failed",
      reportErrorCode: status.errorCode ?? "report_generation_failed",
      reportErrorMessage:
        status.errorMessage ?? "We could not automatically prepare the report.",
    };
    if (ent) {
      ent.status = "failed";
      ent.updatedAt = nowIso();
      upsertEntitlement(ent);
      updated.entitlementStatus = "failed";
    }
  } else {
    updated.reportStatus = status.status === "processing" ? "generating" : "queued";
  }

  return upsertOrder(updated);
}

export async function retryOrderReport(
  tenantId: string,
  orderId: string
): Promise<Order | null> {
  await delay(100);
  const order = getOrderById(orderId);
  if (!order || order.tenantId !== tenantId) return null;
  if (order.status !== "paid") return order;

  const ent = getEntitlementByOrderId(orderId);
  if (!ent) return order;

  ent.status = "paid_generating";
  ent.updatedAt = nowIso();
  upsertEntitlement(ent);

  const updated = upsertOrder({
    ...order,
    reportStatus: "queued",
    reportErrorCode: undefined,
    reportErrorMessage: undefined,
    needsReview: false,
    entitlementStatus: "paid_generating",
    lastSyncAt: nowIso(),
  });

  void triggerPaidReport(updated, ent);
  return updated;
}

export async function setOrderNeedsReview(
  tenantId: string,
  orderId: string,
  needsReview = true
): Promise<Order | null> {
  await delay(80);
  const order = getOrderById(orderId);
  if (!order || order.tenantId !== tenantId) return null;
  return upsertOrder({ ...order, needsReview, lastSyncAt: nowIso() });
}

export async function revokeEntitlement(
  tenantId: string,
  orderId: string
): Promise<Order | null> {
  await delay(80);
  const order = getOrderById(orderId);
  if (!order || order.tenantId !== tenantId) return null;
  const ent = getEntitlementByOrderId(orderId);
  if (!ent) return order;
  ent.status = "revoked";
  ent.revokedAt = nowIso();
  ent.updatedAt = nowIso();
  upsertEntitlement(ent);
  return upsertOrder({
    ...order,
    entitlementStatus: "revoked",
    lastSyncAt: nowIso(),
  });
}

export async function unlockEntitlement(
  tenantId: string,
  orderId: string
): Promise<Order | null> {
  await delay(80);
  const order = getOrderById(orderId);
  if (!order || order.tenantId !== tenantId) return null;
  const ent = getEntitlementByOrderId(orderId);
  if (!ent) return order;
  ent.status = order.reportStatus === "ready" ? "ready" : "paid_generating";
  ent.revokedAt = undefined;
  ent.updatedAt = nowIso();
  upsertEntitlement(ent);
  return upsertOrder({
    ...order,
    entitlementStatus: ent.status,
    lastSyncAt: nowIso(),
  });
}

export async function getUserEntitlements(options: {
  tenantId: string;
  userId?: string;
  sessionId?: string;
}): Promise<Entitlement[]> {
  await delay(80);
  return getEntitlementsForUser(options);
}

export async function checkReportAccess(
  tenantId: string,
  reportId: string,
  options: { userId?: string; sessionId?: string }
): Promise<ReportAccessCheck> {
  await delay(60);
  const list = getEntitlementsForUser({
    tenantId,
    userId: options.userId,
    sessionId: options.sessionId,
  });
  const match = list.find((e) => e.reportId === reportId);
  if (!match) {
    return { allowed: false, reason: "Report not found or not owned by session." };
  }
  if (match.status === "revoked") {
    return {
      allowed: false,
      reason: "Entitlement revoked.",
      entitlementStatus: "revoked",
    };
  }
  if (match.status !== "ready") {
    return {
      allowed: false,
      reason: "Report is not ready yet.",
      entitlementStatus: match.status,
    };
  }
  return { allowed: true, entitlementStatus: "ready", reportStatus: "ready" };
}

export function getPaidReport(reportId: string): ReportV2 | undefined {
  seedStaticMockPaidReports();
  return paidReports.get(reportId);
}

export function resetLifecycleStores(): void {
  paidReports.clear();
}
