"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { getEducations, createEducation, updateEducation, deleteEducation } from "@/lib/adminApi";
import DataTable, { Column } from "@/components/admin/DataTable";
import FormModal from "@/components/admin/FormModal";
import { GraduationCap, Plus } from "lucide-react";
import { FaPercentage } from "react-icons/fa";

interface Edu { id: number; degree: string; institution: string; location: string; year: string; gpa: string; percentage:string }
const empty = { degree: "", institution: "", location: "", year: "", gpa: "", percentage: "" };

export default function EducationPage() {
  const [items, setItems] = useState<Edu[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Edu | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems((await getEducations()).data as Edu[]); } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setForm(empty); setError(""); setModal(true); }
  function openEdit(e: Edu) {
    setEditing(e);
    setForm({ degree: e.degree, institution: e.institution, location: e.location || "", year: e.year || "", gpa: e.gpa || "", percentage: e.percentage|| ""});
    setError(""); setModal(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      if (editing) await updateEducation(editing.id, form);
      else await createEducation(form);
      setModal(false); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function handleDelete(e: Edu) {
    if (!confirm(`Delete "${e.degree}"?`)) return;
    try { await deleteEducation(e.id); await load(); } catch (err) { alert(String(err)); }
  }

  const columns: Column<Edu>[] = [
    { key: "degree", label: "Degree", render: (e) => (
      <div>
        <p className="font-medium text-white">{e.degree}</p>
        <p className="text-xs text-white/40">{e.institution}{e.location ? ` — ${e.location}` : ""}</p>
      </div>
    )},
    { key: "year", label: "Year", width: "80px" },
    { key: "gpa", label: "GPA", width: "70px" },
  ];

  const inp = (key: keyof typeof form, label: string, placeholder = "") => (
    <div className="space-y-1.5">
      <label className="text-xs font-mono uppercase tracking-widest text-white/40">{label}</label>
      <input value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition"
      />
    </div>
  );

  return (
    <div className="px-4 py-6 sm:px-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/20 p-2.5"><GraduationCap size={20} className="text-emerald-400" /></div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/35">Portfolio CMS</p>
            <h1 className="text-2xl font-bold tracking-tight text-white">Education</h1>
          </div>
        </div>
        <button type="button" onClick={() => { console.log("Add Education clicked"); openCreate(); }} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 shadow-lg shadow-violet-950/40 px-4 py-2.5 text-sm font-medium text-white hover:brightness-110 transition">
          <Plus size={15} /> Add Education
        </button>
      </div>

      <DataTable columns={columns} data={items} onEdit={openEdit} onDelete={handleDelete} loading={loading} rowLabel={(r) => r.degree} emptyMessage="No education entries yet." />

      <FormModal title={editing ? "Edit Education" : "Add Education"} isOpen={modal} onClose={() => setModal(false)} onSubmit={handleSubmit} loading={saving}>
        {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-300">{error}</div>}
        {inp("degree", "Degree", "e.g. Bachelor of Computer Science")}
        {inp("institution", "Institution", "e.g. Universitas Indonesia")}
        <div className="grid gap-4 md:grid-cols-3">
          {inp("location", "Location")}
          {inp("year", "Year / Period", "e.g. 2020 – 2024")}
          {inp("gpa", "GPA", "e.g. 3.8")}
          {inp("percentage","percentage", "e.g. 80")}
        </div>
      </FormModal>
    </div>
  );
}
