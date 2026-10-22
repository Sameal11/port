"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadMedia } from "@/lib/adminApi";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  category?: "profile" | "project" | "certificate" | "resume" | "general";
  label?: string;
  accept?: string;
  /** @deprecated no longer used; a fresh session token is fetched per upload. */
  token?: string;
}

export default function ImageUploader({
  value,
  onChange,
  category = "general",
  label = "Upload Image",
  accept = "image/*",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setError("");
      try {
        const payload = await uploadMedia(file, category);
        onChange(payload.data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [category, onChange]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-mono uppercase tracking-widest text-white/40">{label}</p>}

      {/* Preview */}
      {value && (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Preview"
            className="h-24 w-auto rounded-xl border border-white/10 object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Remove image"
            className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-400 transition"
          >
            <X size={10} />
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          dragOver
            ? "border-violet-500 bg-violet-500/10"
            : "border-white/10 hover:border-white/25 hover:bg-white/3"
        }`}
        role="button"
        tabIndex={0}
        aria-label={`${label}: drop a file or press Enter to browse`}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <Loader2 className="mx-auto animate-spin text-violet-400" size={24} />
        ) : (
          <>
            <Upload className="mx-auto mb-2 text-white/30" size={24} />
            <p className="text-sm text-white/40">Drop file here or <span className="text-violet-400">browse</span></p>
            <p className="mt-1 text-xs text-white/25">PNG, JPG, WebP, PDF up to 20MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Or paste URL */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-white/8" />
        <span className="text-xs text-white/25">or paste URL</span>
        <div className="h-px flex-1 bg-white/8" />
      </div>
      <input
        type="url"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://example.com/image.png"
        aria-label={`${label} URL`}
        className="w-full rounded-xl border border-white/10 bg-white/3 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/50 transition"
      />

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
