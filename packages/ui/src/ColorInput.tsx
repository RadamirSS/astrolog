interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export function ColorInput({ label, value, onChange, placeholder = "#8B5CF6", error }: ColorInputProps) {
  const swatchColor = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : "#64748b";

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-slate-400">{label}</label>
      <div className="flex items-center gap-3">
        <span
          className="h-10 w-10 shrink-0 rounded-lg border border-slate-700"
          style={{ backgroundColor: swatchColor }}
        />
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 outline-none focus:border-violet-500"
        />
      </div>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
