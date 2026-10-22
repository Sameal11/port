"use client";

import { useCallback, useEffect, useState } from "react";
import { getSocialLinks, saveSocialLink, deleteSocialLink } from "@/lib/adminApi";
import ToggleSwitch from "@/components/admin/ToggleSwitch";
import { Share2, Save, Trash2, Globe, BookOpen, FolderGit2 } from "lucide-react";

const PLATFORMS = [
  { key: "github",   label: "GitHub",   icon: FolderGit2,   placeholder: "https://github.com/username" },
  { key: "linkedin", label: "LinkedIn", icon: Share2,  placeholder: "https://linkedin.com/in/username" },
  { key: "twitter",  label: "Twitter / X", icon: Globe, placeholder: "https://x.com/username" },
  { key: "youtube",  label: "YouTube",  icon: Globe,  placeholder: "https://youtube.com/@channel" },
  { key: "medium",   label: "Medium",   icon: BookOpen, placeholder: "https://medium.com/@username" },
  { key: "website",  label: "Website",  icon: Globe,    placeholder: "https://yourportfolio.com" },
];

interface SocialLink { id: number; platform: string; url: string; visible: boolean; }

export default function SocialLinksPage() {
  const [links, setLinks] = useState<Record<string, { id?: number; url: string; visible: boolean }>>(() =>
    Object.fromEntries(PLATFORMS.map((p) => [p.key, { url: "", visible: true }]))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getSocialLinks();
      const data = r.data as SocialLink[];
      const mapped: typeof links = Object.fromEntries(PLATFORMS.map((p) => [p.key, { url: "", visible: true }]));
      for (const link of data) {
        mapped[link.platform] = { id: link.id, url: link.url, visible: link.visible };
      }
      setLinks(mapped);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave(platform: string) {
    setSaving(platform);
    setMsg((m) => ({ ...m, [platform]: "" }));
    try {
      const { url, visible } = links[platform];
      await saveSocialLink(platform, url, visible);
      setMsg((m) => ({ ...m, [platform]: "Saved!" }));
      await load();
    } catch (err) {
      setMsg((m) => ({ ...m, [platform]: err instanceof Error ? err.message : "Failed" }));
    } finally { setSaving(null); }
  }

  async function handleDelete(platform: string) {
    const id = links[platform]?.id;
    if (!id || !confirm(`Remove ${platform} link?`)) return;
    try {
      await deleteSocialLink(id);
      setLinks((l) => ({ ...l, [platform]: { url: "", visible: true } }));
      await load();
    } catch (err) { alert(String(err)); }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-white/30 text-sm animate-pulse">Loading…</div>;

  return (
    <div className="px-4 py-6 sm:px-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-pink-500/20 p-2.5"><Share2 size={20} className="text-pink-400" /></div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/35">Portfolio CMS</p>
          <h1 className="text-2xl font-bold tracking-tight text-white">Social Links</h1>
        </div>
      </div>

      <div className="space-y-4">
        {PLATFORMS.map(({ key, label, icon: Icon, placeholder }) => {
          const link = links[key];
          return (
            <div key={key} className="rounded-2xl border border-white/8 bg-white/3 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Icon size={18} className="text-white/60" />
                <span className="text-sm font-medium text-white">{label}</span>
                {link.id && <span className="ml-auto text-xs text-emerald-400">✓ Saved</span>}
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => setLinks((l) => ({ ...l, [key]: { ...l[key], url: e.target.value } }))}
                  placeholder={placeholder}
                  className="flex-1 rounded-xl border border-white/10 bg-white/3 px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50 transition"
                />
                <button
                  type="button"
                  onClick={() => handleSave(key)}
                  disabled={saving === key}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 shadow-lg shadow-violet-950/40 px-3 py-2.5 text-sm text-white hover:brightness-110 disabled:opacity-50 transition"
                  title="Save"
                >
                  {saving === key ? "…" : <Save size={14} />}
                </button>
                {link.id && (
                  <button
                    type="button"
                    onClick={() => handleDelete(key)}
                    className="rounded-xl border border-red-500/20 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition"
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <ToggleSwitch
                  checked={link.visible}
                  onChange={(v) => setLinks((l) => ({ ...l, [key]: { ...l[key], visible: v } }))}
                  label="Visible on portfolio"
                  size="sm"
                />
                {msg[key] && <span className={`text-xs ${msg[key] === "Saved!" ? "text-emerald-400" : "text-red-400"}`}>{msg[key]}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
