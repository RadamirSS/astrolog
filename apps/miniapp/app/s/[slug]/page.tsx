import { Suspense } from "react";
import { PublicSurfaceShell } from "../../components/PublicSurfaceShell";

export default function WebsiteSurfacePage({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading...</div>}>
      <PublicSurfaceShell slug={params.slug} surfaceKind="website" />
    </Suspense>
  );
}
