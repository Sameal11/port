"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { getTechStack, createTechItem, updateTechItem, deleteTechItem, reorderTechStack, getToken } from "@/lib/adminApi";
import DataTable, { Column } from "@/components/admin/DataTable";
import FormModal from "@/components/admin/FormModal";
import OrderableList from "@/components/admin/OrderableList";
import ToggleSwitch from "@/components/admin/ToggleSwitch";
import ImageUploader from "@/components/admin/ImageUploader";
import { Layers, Plus, List, Table2 } from "lucide-react";

const CATEGORIES = ["Languages", "Web & Frameworks", "Cloud", "DevOps", "CyberSecurity", "AI/ML"];

interface TechItem {
  id: number; name: string; logo_url: string; category: string;
  proficiency: number; visible: boolean; display_order: number;
}

const empty = { name: "", logo_url: "", category: "Web & Frameworks", proficiency: 3, visible: true };

export default function TechStackPage() {
  const [items, setItems] = useState<TechItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<TechItem | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "order">("table");
  const [token, setToken] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, t] = await Promise.all([getTechStack(), getToken()]);
      setItems(r.data as TechItem[]);
      setToken(t);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setForm(empty); setError(""); setModal(true); }
  function openEdit(item: TechItem) {
    setEditing(item);
    setForm({ name: item.name, logo_url: item.logo_url || "", category: item.category || "Web & Frameworks", proficiency: item.proficiency || 3, visible: item.visible });
    setError(""); setModal(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      if (editing) await updateTechItem(editing.id, form);
      else await createTechItem(form);
      setModal(false); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function handleDelete(item: TechItem) {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try { await deleteTechItem(item.id); await load(); } catch (err) { alert(String(err)); }
  }

  async function handleReorder(newItems: TechItem[]) {
    setItems(newItems);
    try { await reorderTechStack(newItems.map((i) => i.id)); } catch { await load(); }
  }

  const columns: Column<TechItem>[] = [
    {
      key: "name", label: "Technology", render: (t) => (
        <div className="flex items-center gap-3">
          {t.logo_url && <img src={t.logo_url} alt={t.name} className="h-7 w-7 rounded object-contain" />}
          <span className="font-medium text-white">{t.name}</span>
        </div>
      )
    },
    { key: "category", label: "Category", width: "110px", render: (t) => <span className="text-xs px-2 py-1 rounded-lg bg-white/8 text-white/60">{t.category}</span> },
    {
      key: "proficiency", label: "Proficiency", width: "110px", render: (t) => (
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className={`h-1.5 w-4 rounded-full ${n <= (t.proficiency || 0) ? "bg-violet-500" : "bg-white/10"}`} />
          ))}
        </div>
      )
    },
    { key: "visible", label: "Visible", width: "70px", render: (t) => <span className={`text-xs ${t.visible ? "text-emerald-400" : "text-white/25"}`}>{t.visible ? "✓" : "—"}</span> },
  ];

  return (
    <div className="px-4 py-6 sm:px-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-500/20 p-2.5"><Layers size={20} className="text-violet-400" /></div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/35">Portfolio CMS</p>
            <h1 className="text-2xl font-bold tracking-tight text-white">Tech Stack <span className="text-white/30">({items.length})</span></h1>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-xl border border-white/8 overflow-hidden">
            <button onClick={() => setViewMode("table")} className={`px-3 py-2 text-xs transition ${viewMode === "table" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}><Table2 size={14} /></button>
            <button onClick={() => setViewMode("order")} className={`px-3 py-2 text-xs transition ${viewMode === "order" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}><List size={14} /></button>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 shadow-lg shadow-violet-950/40 px-4 py-2.5 text-sm font-medium text-white hover:brightness-110 transition">
            <Plus size={15} /> Add Skill
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        <DataTable columns={columns} data={items} onEdit={openEdit} onDelete={handleDelete} loading={loading} rowLabel={(r) => r.name} searchText={(r) => `${r.name} ${r.category ?? ""}`} emptyMessage="No tech stack items yet." />
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-white/35">Drag to reorder display order on portfolio.</p>
          <OrderableList items={items} onReorder={handleReorder} renderItem={(item) => (
            <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-4 py-3">
              {item.logo_url && <img src={item.logo_url} alt={item.name} className="h-6 w-6 rounded object-contain" />}
              <span className="flex-1 text-sm font-medium text-white">{item.name}</span>
              <span className="text-xs text-white/30">{item.category}</span>
            </div>
          )} />
        </div>
      )}

      <FormModal title={editing ? "Edit Skill" : "Add Skill"} isOpen={modal} onClose={() => setModal(false)} onSubmit={handleSubmit} loading={saving}>
        {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-300">{error}</div>}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-widest text-white/40">Name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-widest text-white/40">Category</label>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-widest text-white/40">Proficiency (1-5)</label>
          <div className="flex items-center gap-3">
            <input type="range" min={1} max={5} value={form.proficiency} onChange={(e) => setForm((f) => ({ ...f, proficiency: Number(e.target.value) }))} className="flex-1 accent-violet-500" />
            <span className="text-sm text-white/70 w-4">{form.proficiency}</span>
          </div>
        </div>
        <ImageUploader value={form.logo_url} onChange={(url) => setForm((f) => ({ ...f, logo_url: url }))} category="general" label="Logo / Icon" token={token} />
        <ToggleSwitch checked={form.visible} onChange={(v) => setForm((f) => ({ ...f, visible: v }))} label="Visible on portfolio" />
      </FormModal>
    </div>
  );
}
