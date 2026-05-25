"use client";

interface CosmicLoadingProps {
  steps: string[];
  activeStep: number;
  subtitle?: string;
}

export function CosmicLoading({ steps, activeStep, subtitle }: CosmicLoadingProps) {
  const progress = ((activeStep + 1) / steps.length) * 100;

  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <div className="relative flex h-36 w-36 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120" aria-hidden>
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="color-mix(in srgb, var(--color-border) 60%, transparent)"
            strokeWidth="4"
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="var(--vp-accent, var(--color-primary))"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${(progress / 100) * 327} 327`}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div
          className="relative flex h-20 w-20 items-center justify-center rounded-full"
          style={{
            background: "radial-gradient(circle, var(--vp-accent-muted, color-mix(in srgb, var(--color-primary) 25%, transparent)), transparent 70%)",
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
              stroke="var(--vp-accent, var(--color-primary))"
              strokeWidth="1.5"
              fill="color-mix(in srgb, var(--vp-accent, var(--color-primary)) 20%, transparent)"
            />
          </svg>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-3">
        {steps.map((step, i) => (
          <div
            key={step}
            className={`flex items-center gap-3 text-sm transition-opacity ${
              i <= activeStep ? "opacity-100" : "opacity-35"
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                i < activeStep
                  ? "bg-[var(--vp-accent,var(--color-primary))] text-white"
                  : i === activeStep
                    ? "border-2 border-[var(--vp-accent,var(--color-primary))] text-[var(--vp-accent,var(--color-primary))]"
                    : "border border-[var(--color-border)] text-[var(--color-text-muted)]"
              }`}
            >
              {i < activeStep ? "✓" : i + 1}
            </span>
            <span className={i === activeStep ? "font-medium text-[var(--color-text)]" : "text-[var(--color-text-muted)]"}>
              {step}
            </span>
          </div>
        ))}
      </div>

      {subtitle && (
        <p className="text-center text-sm text-[var(--color-text-muted)]">{subtitle}</p>
      )}
    </div>
  );
}
