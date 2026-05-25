"use client";

import { SectionCard } from "@astro/ui";
import { useDashboard } from "../../components/DashboardProvider";

export default function PlaceholdersPage() {
  const { config, loading } = useDashboard();

  if (loading || !config) return <p className="text-slate-400">Loading...</p>;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Future Modules</h1>
        <p className="text-slate-400">Coming soon — placeholders only</p>
      </div>
      <SectionCard title="Telegram Integration">
        <p className="text-sm text-slate-400">
          Connect your Telegram bot to deploy the mini app. Bot connection is not available in MVP.
        </p>
        <button
          type="button"
          disabled
          className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm opacity-50"
        >
          Connect Bot (Coming Soon)
        </button>
      </SectionCard>
      <SectionCard title="Payments">
        <p className="text-sm text-slate-400">
          Payments module is disabled. Enabled: {String(config.modules.payments?.enabled ?? false)}
        </p>
      </SectionCard>
      <SectionCard title="Analytics">
        <div className="h-32 rounded-lg bg-slate-800/50 flex items-center justify-center text-sm text-slate-500">
          Mock chart placeholder
        </div>
        <button
          type="button"
          disabled
          className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm opacity-50"
        >
          Connect Analytics (Coming Soon)
        </button>
      </SectionCard>
    </div>
  );
}
