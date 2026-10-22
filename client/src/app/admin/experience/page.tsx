"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { getExperiences, createExperience, updateExperience, deleteExperience } from "@/lib/adminApi";
import DataTable, { Column } from "@/components/admin/DataTable";
import FormModal from "@/components/admin/FormModal";
import ToggleSwitch from "@/components/admin/ToggleSwitch";
import { Briefcase, Plus } from "lucide-react";

interface Exp {
  id: number; role: string; company: string; location: string;
  start_date: string; end_date: string; is_current: boolean; description: string[];
}

const empty = { role: "", company: "", location: "", start_date: "", end_date: "", is_current: false, description: "" };

export default function ExperiencePage() {
  const [items, setItems] = useState<Exp[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Exp | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems((await getExperiences()).data as Exp[]); } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setForm(empty); setError(""); setModal(true); }
  function openEdit(e: Exp) {
    setEditing(e);
    setForm({ role: e.role, company: e.company, location: e.location || "", start_date: e.start_date || "", end_date: e.end_date || "", is_current: e.is_current, description: (e.description || []).join("\n") });
    setError(""); setModal(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const payload = { ...form, description: form.description.split("\n").filter(Boolean) };
      if (editing) await updateExperience(editing.id, payload);
      else await createExperience(payload);
      setModal(false); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function handleDelete(e: Exp) {
    if (!confirm(`Delete "${e.role} at ${e.company}"?`)) return;
    try { await deleteExperience(e.id); await load(); } catch (err) { alert(String(err)); }
  }

  const columns: Column<Exp>[] = [
    { key: "role", label: "Position", render: (e) => (
      <div>
        <p className="font-medium text-white">{e.role}</p>
        <p className="text-xs text-white/40">{e.company}{e.location ? ` — ${e.location}` : ""}</p>
      </div>
    )},
    { key: "start_date", label: "Start", width: "100px" },
    { key: "end_date", label: "End", width: "100px", render: (e) => <span>{e.is_current ? "Present" : (e.end_date || "—")}</span> },
  ];

  const inp = (key: keyof typeof form, label: string, type = "text") => (
    <div className="space-y-1.5">
      <label className="text-xs font-mono uppercase tracking-widest text-white/40">{label}</label>
      <input type={type} value={form[key] as string} onChange={(ev) => setForm((f) => ({ ...f, [key]: ev.target.value }))}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition"
      />
    </div>
  );

  return (
    <div className="px-4 py-6 sm:px-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-500/20 p-2.5"><Briefcase size={20} className="text-amber-400" /></div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/35">Portfolio CMS</p>
            <h1 className="text-2xl font-bold tracking-tight text-white">Experience</h1>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 shadow-lg shadow-violet-950/40 px-4 py-2.5 text-sm font-medium text-white hover:brightness-110 transition">
          <Plus size={15} /> Add Experience
        </button>
      </div>

      <DataTable columns={columns} data={items} onEdit={openEdit} onDelete={handleDelete} loading={loading} rowLabel={(r) => r.role} emptyMessage="No experience entries yet." />

      <FormModal title={editing ? "Edit Experience" : "Add Experience"} isOpen={modal} onClose={() => setModal(false)} onSubmit={handleSubmit} loading={saving}>
        {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-300">{error}</div>}
        <div className="grid gap-4 md:grid-cols-2">
          {inp("role", "Role / Position")}
          {inp("company", "Company")}
        </div>
        {inp("location", "Location")}
        <div className="grid gap-4 md:grid-cols-2">
          {inp("start_date", "Start Date", "date")}
          {!form.is_current && inp("end_date", "End Date", "date")}
        </div>
        <ToggleSwitch checked={form.is_current} onChange={(v) => setForm((f) => ({ ...f, is_current: v }))} label="Currently working here" />
        <div className="space-y-1.5">
          <label className="text-xs font-mono uppercase tracking-widest text-white/40">Description (one bullet per line)</label>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={5} placeholder="Built REST APIs with Node.js&#10;Improved performance by 40%&#10;…"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/50 transition resize-none font-mono"
          />
        </div>
      </FormModal>
    </div>
  );
}
