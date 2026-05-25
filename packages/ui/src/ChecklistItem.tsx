interface ChecklistItemProps {
  label: string;
  done: boolean;
  href?: string;
}

export function ChecklistItem({ label, done, href }: ChecklistItemProps) {
  const content = (
    <>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
          done ? "bg-emerald-600 text-white" : "border border-slate-600 text-slate-500"
        }`}
      >
        {done ? "✓" : ""}
      </span>
      <span className={done ? "text-slate-300" : "text-slate-400"}>{label}</span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-slate-800/50"
      >
        {content}
      </a>
    );
  }

  return <div className="flex items-center gap-3 px-2 py-2 text-sm">{content}</div>;
}
