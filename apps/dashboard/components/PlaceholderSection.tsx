import { SectionCard } from "@astro/ui";

interface PlaceholderSectionProps {
  title: string;
  description: string;
  buttonLabel?: string;
}

export function PlaceholderSection({ title, description, buttonLabel }: PlaceholderSectionProps) {
  return (
    <SectionCard title={title}>
      <p className="text-sm text-slate-400">{description}</p>
      {buttonLabel && (
        <button
          type="button"
          disabled
          className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm opacity-50"
        >
          {buttonLabel}
        </button>
      )}
    </SectionCard>
  );
}
