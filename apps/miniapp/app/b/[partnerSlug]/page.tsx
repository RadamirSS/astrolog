import { Suspense } from "react";
import { PartnerEntryScreen } from "@astro/miniapp-renderer";

export default function PartnerLandingPage({
  params,
}: {
  params: { partnerSlug: string };
}) {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading...</div>}>
      <PartnerEntryScreen partnerSlug={params.partnerSlug} />
    </Suspense>
  );
}
