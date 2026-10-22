"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMedia, uploadMedia, deleteMedia } from "@/lib/adminApi";
import { Image as ImageIcon, Upload, Trash2, Copy, Check, Loader2 } from "lucide-react";

interface MediaItem {
  id: number; filename: string; storage_path: string; storage_url: string;
  file_type: string; file_size: number; bucket: string; created_at: string;
}

const CATEGORIES = ["general", "profile", "project", "certificate", "resume"];

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState("general");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems((await getMedia()).data as MediaItem[]); } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true); setError("");
    try {
      for (const file of Array.from(files)) {
        await uploadMedia(file, category);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally { setUploading(false); }
  }

  async function handleDelete(item: MediaItem) {
    if (!confirm(`Delete "${item.filename}"?`)) return;
    try { await deleteMedia(item.id, item.storage_path, item.bucket); await load(); }
    catch (err) { alert(String(err)); }
  }

  function copyUrl(item: MediaItem) {
    navigator.clipboard.writeText(item.storage_url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  }

  return (
    <div className="px-4 py-6 sm:px-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-500/20 p-2.5"><ImageIcon size={20} className="text-violet-400" /></div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/35">Portfolio CMS</p>
            <h1 className="text-2xl font-bold tracking-tight text-white">Media Library <span className="text-white/30">({items.length})</span></h1>
          </div>
        </div>
      </div>

      {/* Upload area */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-6 space-y-4">
        <div className="flex items-center gap-4">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 shadow-lg shadow-violet-950/40 px-4 py-2.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50 transition"
          >
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {uploading ? "Uploading…" : "Upload Files"}
          </button>
          <input ref={inputRef} type="file" multiple accept="image/*,application/pdf" className="hidden" onChange={(e) => handleUpload(e.target.files)} />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-white/30 text-sm animate-pulse">Loading…</div>
      ) : items.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-white/25 text-sm">No media uploaded yet.</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {items.map((item) => (
            <div key={item.id} className="group relative rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
              {item.file_type === "image" ? (
                <img src={item.storage_url} alt={item.filename} className="h-32 w-full object-cover" />
              ) : (
                <div className="flex h-32 items-center justify-center bg-white/5">
                  <span className="text-3xl">{item.file_type === "pdf" ? "📄" : "📎"}</span>
                </div>
              )}
              {/* Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => copyUrl(item)} className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20 transition">
                  {copiedId === item.id ? <Check size={11} /> : <Copy size={11} />}
                  {copiedId === item.id ? "Copied!" : "Copy URL"}
                </button>
                <button onClick={() => handleDelete(item)} className="flex items-center gap-1 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/30 transition">
                  <Trash2 size={11} /> Delete
                </button>
              </div>
              <div className="px-3 py-2">
                <p className="truncate text-xs text-white/60">{item.filename}</p>
                <p className="text-xs text-white/25">{formatSize(item.file_size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
