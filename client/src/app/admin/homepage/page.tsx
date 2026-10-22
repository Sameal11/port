"use client";

import { useCallback, useEffect, useState } from "react";
import { getHomepageSections, updateHomepageSection, reorderHomepageSections } from "@/lib/adminApi";
import OrderableList from "@/components/admin/OrderableList";
import ToggleSwitch from "@/components/admin/ToggleSwitch";
import { Layout, Save } from "lucide-react";

interface Section { id: number; section_key: string; label: string; visible: boolean; display_order: number; }

export default function HomepagePage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setSections((await getHomepageSections()).data as Section[]); } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleVisible(section: Section) {
    const updated = !section.visible;
    setSections((prev) => prev.map((s) => s.id === section.id ? { ...s, visible: updated } : s));
    try { await updateHomepageSection(section.id, { visible: updated }); } catch { await load(); }
  }

  async function handleReorder(newItems: Section[]) {
    setSections(newItems);
    try {
      await reorderHomepageSections(newItems.map((s) => s.id));
    } catch { await load(); }
  }

  async function handleSave() {
    setSaving(true);
    setMsg("");
    try {
      await Promise.all(
        sections.map((s, idx) =>
          updateHomepageSection(s.id, { visible: s.visible, display_order: idx + 1 })
        )
      );
      setMsg("Layout saved!");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally { setSaving(false); }
  }

  const ICONS: Record<string, string> = {
    hero: "🦸", about: "👤", projects: "📁", skills: "⚡",
    experience: "💼", certifications: "🏆", contact: "✉️",
  };

  return (
    <div className="px-4 py-6 sm:px-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/20 p-2.5"><Layout size={20} className="text-cyan-400" /></div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/35">Portfolio CMS</p>
            <h1 className="text-2xl font-bold tracking-tight text-white">Homepage Builder</h1>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 shadow-lg shadow-violet-950/40 px-4 py-2.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50 transition"
        >
          <Save size={15} />
          {saving ? "Saving…" : "Save Layout"}
        </button>
      </div>

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm ${msg.includes("saved") ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "bg-red-500/10 text-red-300 border border-red-500/20"}`}>
          {msg}
        </div>
      )}

      <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
        <p className="text-xs text-white/35 mb-4">Drag sections to reorder. Toggle to show/hide on the public portfolio.</p>
        {loading ? (
          <p className="text-sm text-white/30 animate-pulse">Loading…</p>
        ) : (
          <OrderableList
            items={sections}
            onReorder={handleReorder}
            renderItem={(section) => (
              <div className={`flex items-center gap-4 rounded-xl border px-4 py-3.5 transition ${section.visible ? "border-white/10 bg-white/3" : "border-white/5 bg-white/1 opacity-50"}`}>
                <span className="text-lg">{ICONS[section.section_key] || "📄"}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{section.label}</p>
                  <p className="text-xs text-white/30 font-mono">{section.section_key}</p>
                </div>
                <ToggleSwitch
                  checked={section.visible}
                  onChange={() => toggleVisible(section)}
                  size="sm"
                />
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}
