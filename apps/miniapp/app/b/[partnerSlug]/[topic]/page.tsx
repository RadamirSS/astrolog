import { Suspense } from "react";
import { PartnerEntryScreen } from "@astro/miniapp-renderer";

export default function PartnerTopicPage({
  params,
}: {
  params: { partnerSlug: string; topic: string };
}) {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading...</div>}>
      <PartnerEntryScreen partnerSlug={params.partnerSlug} topicSlug={params.topic} />
    </Suspense>
  );
}
