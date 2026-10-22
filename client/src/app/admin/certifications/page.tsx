"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { getCertifications, createCertification, updateCertification, deleteCertification, getToken } from "@/lib/adminApi";
import DataTable, { Column } from "@/components/admin/DataTable";
import FormModal from "@/components/admin/FormModal";
import ImageUploader from "@/components/admin/ImageUploader";
import ToggleSwitch from "@/components/admin/ToggleSwitch";
import { Award, Plus } from "lucide-react";

interface Cert {
  id: number; title: string; issuer: string; credential_url: string;
  credential_id: string; issue_date: string; expiry_date: string; image_url: string;
  featured: boolean; visible: boolean;
}

const empty = { title: "", issuer: "", credential_url: "", credential_id: "", issue_date: "", expiry_date: "", image_url: "", featured: false, visible: true };

export default function CertificationsPage() {
  const [items, setItems] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Cert | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, t] = await Promise.all([getCertifications(), getToken()]);
      setItems(r.data as Cert[]);
      setToken(t);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setForm(empty); setError(""); setModal(true); }
  function openEdit(c: Cert) {
    setEditing(c);
    setForm({ title: c.title, issuer: c.issuer || "", credential_url: c.credential_url || "", credential_id: c.credential_id || "", issue_date: c.issue_date || "", expiry_date: c.expiry_date || "", image_url: c.image_url || "", featured: c.featured, visible: c.visible });
    setError(""); setModal(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      if (editing) await updateCertification(editing.id, form);
      else await createCertification(form);
      setModal(false); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function handleDelete(c: Cert) {
    if (!confirm(`Delete "${c.title}"?`)) return;
    try { await deleteCertification(c.id); await load(); } catch (err) { alert(String(err)); }
  }

  const inp = (key: keyof typeof form, label: string, type = "text") => (
    <div className="space-y-1.5">
      <label className="text-xs font-mono uppercase tracking-widest text-white/40">{label}</label>
      <input type={type} value={form[key] as string} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 transition"
      />
    </div>
  );

  const columns: Column<Cert>[] = [
    { key: "title", label: "Certificate", render: (c) => (
      <div>
        <p className="font-medium text-white">{c.title}</p>
        <p className="text-xs text-white/40">{c.issuer}</p>
      </div>
    )},
    { key: "issue_date", label: "Issued", width: "110px" },
    { key: "expiry_date", label: "Expires", width: "110px" },
    { key: "featured", label: "Featured", width: "80px", render: (c) => <span className={`text-xs px-2 py-1 rounded-lg ${c.featured ? "bg-amber-500/20 text-amber-300" : "text-white/25"}`}>{c.featured ? "⭐ Yes" : "No"}</span> },
    { key: "visible", label: "Visible", width: "70px", render: (c) => <span className={`text-xs ${c.visible ? "text-emerald-400" : "text-white/25"}`}>{c.visible ? "✓" : "—"}</span> },
  ];

  return (
    <div className="px-4 py-6 sm:px-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/20 p-2.5"><Award size={20} className="text-cyan-400" /></div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/35">Portfolio CMS</p>
            <h1 className="text-2xl font-bold tracking-tight text-white">Certifications <span className="text-white/30">({items.length})</span></h1>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 shadow-lg shadow-violet-950/40 px-4 py-2.5 text-sm font-medium text-white hover:brightness-110 transition">
          <Plus size={15} /> Add Certificate
        </button>
      </div>

      <DataTable columns={columns} data={items} onEdit={openEdit} onDelete={handleDelete} loading={loading} rowLabel={(r) => r.title} searchText={(r) => `${r.title} ${r.issuer ?? ""}`} emptyMessage="No certifications yet." />

      <FormModal title={editing ? "Edit Certificate" : "Add Certificate"} isOpen={modal} onClose={() => setModal(false)} onSubmit={handleSubmit} loading={saving}>
        {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-300">{error}</div>}
        {inp("title", "Title")}
        {inp("issuer", "Issuing Organization")}
        {inp("credential_id", "Credential ID (optional)")}
        {inp("credential_url", "Credential URL", "url")}
        <div className="grid gap-4 md:grid-cols-2">
          {inp("issue_date", "Issue Date", "date")}
          {inp("expiry_date", "Expiry Date", "date")}
        </div>
        <ImageUploader value={form.image_url} onChange={(url) => setForm((f) => ({ ...f, image_url: url }))} category="certificate" label="Certificate Image" token={token} />
        <div className="flex items-center gap-6">
          <ToggleSwitch checked={form.featured} onChange={(v) => setForm((f) => ({ ...f, featured: v }))} label="Featured" />
          <ToggleSwitch checked={form.visible} onChange={(v) => setForm((f) => ({ ...f, visible: v }))} label="Visible" />
        </div>
      </FormModal>
    </div>
  );
}
