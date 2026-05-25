"use client";

import { useRef, useState } from "react";
import { SafeImage } from "./SafeImage";

interface MediaUploadFieldProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  onUpload?: (file: File) => Promise<string>;
  showUpload?: boolean;
  urlLabel?: string;
  urlPlaceholder?: string;
  error?: string;
  previewVariant?: "avatar" | "cover" | "logo";
}

export function MediaUploadField({
  label,
  value,
  onChange,
  onUpload,
  showUpload = false,
  urlLabel = "Image URL",
  urlPlaceholder = "Paste image URL or upload a file",
  error,
  previewVariant = "cover",
}: MediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !onUpload) return;
    setUploadError(null);
    setUploading(true);
    try {
      const url = await onUpload(file);
      onChange(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-200">{label}</label>
      <div className="flex items-start gap-4">
        <div
          className={
            previewVariant === "avatar"
              ? "h-16 w-16 shrink-0 overflow-hidden rounded-full border border-slate-700"
              : previewVariant === "logo"
                ? "h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-700"
                : "h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-slate-700"
          }
        >
          <SafeImage
            src={value}
            alt={label}
            variant={previewVariant}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {showUpload && onUpload && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload image"}
              </button>
              <span className="text-xs text-slate-500">JPEG, PNG, WebP up to 5MB</span>
            </div>
          )}
          <input
            type="url"
            value={value ?? ""}
            placeholder={urlPlaceholder}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
          />
          <p className="text-xs text-slate-500">{urlLabel}</p>
          {(error || uploadError) && (
            <p className="text-xs text-red-400">{error ?? uploadError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
