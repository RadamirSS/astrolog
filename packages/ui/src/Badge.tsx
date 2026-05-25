import type { ReactNode } from "react";

interface BadgeProps {
  variant?: "success" | "warning" | "neutral" | "info" | "error";
  children: ReactNode;
}

export function Badge({ variant = "neutral", children }: BadgeProps) {
  const variants = {
    success: "bg-emerald-900/50 text-emerald-300",
    warning: "bg-amber-900/50 text-amber-300",
    neutral: "bg-slate-800 text-slate-300",
    info: "bg-violet-900/50 text-violet-300",
    error: "bg-red-900/50 text-red-300",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
