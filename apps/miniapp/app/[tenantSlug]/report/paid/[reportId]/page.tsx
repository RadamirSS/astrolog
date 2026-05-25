"use client";

import { ReportScreen } from "@astro/miniapp-renderer";

export default function PaidReportPage({ params }: { params: { reportId: string } }) {
  return <ReportScreen reportId={params.reportId} />;
}
