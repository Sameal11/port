"use client";

import { useCallback, useEffect, useState } from "react";
import { getTheme, saveTheme } from "@/lib/adminApi";
import ToggleSwitch from "@/components/admin/ToggleSwitch";
import { Palette, Save } from "lucide-react";

interface Theme {
  primary_color: string; secondary_color: string;
  dark_mode: boolean; animations_enabled: boolean;
  hero_bg_type: string; hero_bg_value: string;
}

const defaults: Theme = {
  primary_color: "#7c3aed", secondary_color: "#06b6d4",
  dark_mode: true, animations_enabled: true,
  hero_bg_type: "animated", hero_bg_value: "",
};

export default function ThemePage() {
  const [theme, setTheme] = useState<Theme>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getTheme();
      if (r.data) setTheme({ ...defaults, ...(r.data as Partial<Theme>) });
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    setSaving(true); setMsg({ type: "", text: "" });
    try {
      await saveTheme(theme);
      setMsg({ type: "success", text: "Theme saved! Refresh the portfolio to see changes." });
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Save failed" });
    } finally { setSaving(false); }
  }

  const colorInput = (key: keyof Theme, label: string) => (
    <div className="space-y-2">
      <label className="text-xs font-mono uppercase tracking-widest text-white/40">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={theme[key] as string}
          onChange={(e) => setTheme((t) => ({ ...t, [key]: e.target.value }))}
          className="h-10 w-16 cursor-pointer rounded-xl border border-white/10 bg-transparent"
        />
        <input
          type="text"
          value={theme[key] as string}
          onChange={(e) => setTheme((t) => ({ ...t, [key]: e.target.value }))}
          className="flex-1 rounded-xl border border-white/10 bg-white/3 px-3 py-2 text-sm text-white font-mono outline-none focus:border-violet-500/50 transition"
        />
        {/* Preview swatch */}
        <div className="h-8 w-8 rounded-lg" style={{ background: theme[key] as string }} />
      </div>
    </div>
  );

  return (
    <div className="px-4 py-6 sm:px-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-pink-500/20 p-2.5"><Palette size={20} className="text-pink-400" /></div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/35">Portfolio CMS</p>
            <h1 className="text-2xl font-bold tracking-tight text-white">Theme Customizer</h1>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving || loading} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 shadow-lg shadow-violet-950/40 px-4 py-2.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50 transition">
          <Save size={15} />
          {saving ? "Saving…" : "Save Theme"}
        </button>
      </div>

      {msg.text && (
        <div className={`rounded-xl px-4 py-3 text-sm ${msg.type === "success" ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "bg-red-500/10 text-red-300 border border-red-500/20"}`}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40 text-white/30 text-sm animate-pulse">Loading…</div>
      ) : (
        <div className="space-y-6">
          {/* Colors */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-6 space-y-5">
            <p className="text-xs font-mono uppercase tracking-widest text-white/35">Colors</p>
            {colorInput("primary_color", "Primary Color")}
            {colorInput("secondary_color", "Secondary Color")}

            {/* Live gradient preview */}
            <div className="h-10 rounded-xl" style={{ background: `linear-gradient(135deg, ${theme.primary_color}, ${theme.secondary_color})` }} />
          </div>

          {/* Toggles */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-6 space-y-5">
            <p className="text-xs font-mono uppercase tracking-widest text-white/35">Display Options</p>
            <ToggleSwitch checked={theme.dark_mode} onChange={(v) => setTheme((t) => ({ ...t, dark_mode: v }))} label="Dark Mode" />
            <ToggleSwitch checked={theme.animations_enabled} onChange={(v) => setTheme((t) => ({ ...t, animations_enabled: v }))} label="Enable Animations" />
          </div>

          {/* Hero Background */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-6 space-y-4">
            <p className="text-xs font-mono uppercase tracking-widest text-white/35">Hero Background</p>
            <div className="grid grid-cols-3 gap-3">
              {["animated", "gradient", "image"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTheme((t) => ({ ...t, hero_bg_type: type }))}
                  className={`rounded-xl border py-3 text-sm font-medium capitalize transition ${
                    theme.hero_bg_type === type
                      ? "border-violet-500 bg-violet-500/20 text-violet-300"
                      : "border-white/8 text-white/50 hover:border-white/20"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {theme.hero_bg_type === "image" && (
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase tracking-widest text-white/40">Image URL</label>
                <input
                  type="url"
                  value={theme.hero_bg_value}
                  onChange={(e) => setTheme((t) => ({ ...t, hero_bg_value: e.target.value }))}
                  placeholder="https://example.com/bg.jpg"
                  className="w-full rounded-xl border border-white/10 bg-white/3 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
