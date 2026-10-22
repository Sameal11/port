"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { getAchievements, createAchievement, updateAchievement, deleteAchievement } from "@/lib/adminApi";
import DataTable, { Column } from "@/components/admin/DataTable";
import FormModal from "@/components/admin/FormModal";
import { Trophy, Plus } from "lucide-react";

interface Ach { id: number; title: string; description: string; achievement_date: string; }
const empty = { title: "", description: "", achievement_date: "" };

export default function AchievementsPage() {
  const [items, setItems] = useState<Ach[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Ach | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems((await getAchievements()).data as Ach[]); } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setForm(empty); setError(""); setModal(true); }
  function openEdit(a: Ach) {
    setEditing(a);
    setForm({ title: a.title, description: a.description || "", achievement_date: a.achievement_date || "" });
    setError(""); setModal(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      if (editing) await updateAchievement(editing.id, form);
      else await createAchievement(form);
      setModal(false); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function handleDelete(a: Ach) {
    if (!confirm(`Delete "${a.title}"?`)) return;
    try { await deleteAchievement(a.id); await load(); } catch (err) { alert(String(err)); }
  }

  const columns: Column<Ach>[] = [
    { key: "title", label: "Achievement", render: (a) => (
      <div>
        <p className="font-medium text-white">🏆 {a.title}</p>
        {a.description && <p className="text-xs text-white/40 mt-0.5 truncate max-w-sm">{a.description}</p>}
      </div>
    )},
    { key: "achievement_date", label: "Date", width: "110px" },
  ];

  return (
    <div className="px-4 py-6 sm:px-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-500/20 p-2.5"><Trophy size={20} className="text-amber-400" /></div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/35">Portfolio CMS</p>
            <h1 className="text-2xl font-bold tracking-tight text-white">Achievements</h1>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 shadow-lg shadow-violet-950/40 px-4 py-2.5 text-sm font-medium text-white hover:brightness-110 transition">
          <Plus size={15} /> Add Achievement
        </button>
      </div>

      <DataTable columns={columns} data={items} onEdit={openEdit} onDelete={handleDelete} loading={loading} rowLabel={(r) => r.title} emptyMessage="No achievements yet." />

      <FormModal title={editing ? "Edit Achievement" : "Add Achievement"} isOpen={modal} onClose={() => setModal(false)} onSubmit={handleSubmit} loading={saving}>
        {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-300">{error}</div>}
        <div className="space-y-1.5">
          <label className="text-xs font-mono uppercase tracking-widest text-white/40">Title</label>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required placeholder="Won Hackathon XYZ"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-mono uppercase tracking-widest text-white/40">Description</label>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition resize-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-mono uppercase tracking-widest text-white/40">Date</label>
          <input type="date" value={form.achievement_date} onChange={(e) => setForm((f) => ({ ...f, achievement_date: e.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition"
          />
        </div>
      </FormModal>
    </div>
  );
}
