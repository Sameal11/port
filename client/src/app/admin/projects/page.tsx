"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  getProjects, createProject, updateProject, deleteProject, reorderProjects, notify,
} from "@/lib/adminApi";
import DataTable, { Column } from "@/components/admin/DataTable";
import FormModal from "@/components/admin/FormModal";
import TagInput from "@/components/admin/TagInput";
import ToggleSwitch from "@/components/admin/ToggleSwitch";
import OrderableList from "@/components/admin/OrderableList";
import ImageUploader from "@/components/admin/ImageUploader";
import { Plus, FolderGit2, Star, Eye, EyeOff, List, Table2 } from "lucide-react";

interface Project {
  id: string; title: string; description: string;
  live_url: string; github_url: string; image_url: string;
  technologies: string[]; key_features: string[]; image_urls: string[];
  featured: boolean; visible: boolean; display_order: number; source: string;
}

const empty: Omit<Project, "id" | "display_order" | "source"> = {
  title: "", description: "", live_url: "", github_url: "", image_url: "",
  technologies: [], key_features: [], image_urls: [], featured: false, visible: true,
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "order">("table");
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const r = await getProjects();
      setProjects(r.data as Project[]);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Couldn't load projects.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setError("");
    setModalOpen(true);
  }

  function openEdit(p: Project) {
    setEditing(p);
    setForm({
      title: p.title, description: p.description, live_url: p.live_url || "",
      github_url: p.github_url || "", image_url: p.image_url || "",
      technologies: p.technologies || [], key_features: p.key_features || [],
      image_urls: p.image_urls || [], featured: p.featured, visible: p.visible,
    });
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing) await updateProject(editing.id, form);
      else await createProject(form);
      setModalOpen(false);
      notify(editing ? `Saved “${form.title}”.` : `Added “${form.title}”.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally { setSaving(false); }
  }

  async function handleDelete(p: Project) {
    if (!confirm(`Delete "${p.title}"? This can't be undone.`)) return;
    try {
      await deleteProject(p.id);
      notify(`Deleted “${p.title}”.`);
      await load();
    } catch {
      // The failure is shown by the admin toaster.
    }
  }

  async function handleReorder(newItems: Project[]) {
    setProjects(newItems);
    try {
      await reorderProjects(newItems.map((p) => p.id));
    } catch { await load(); }
  }

  // Optimistic toggle; reverts if the server rejects the change.
  async function toggleFlag(p: Project, flag: "featured" | "visible") {
    const next = !p[flag];
    setProjects((prev) => prev.map((x) => x.id === p.id ? { ...x, [flag]: next } : x));
    try {
      await updateProject(p.id, { [flag]: next });
    } catch {
      setProjects((prev) => prev.map((x) => x.id === p.id ? { ...x, [flag]: !next } : x));
    }
  }

  const columns: Column<Project>[] = [
    {
      key: "title", label: "Project",
      render: (p) => (
        <div>
          <p className="font-medium text-white">{p.title}</p>
          {p.description
            ? <p className="text-xs text-white/40 mt-0.5 line-clamp-1 max-w-xs">{p.description}</p>
            : <p className="text-xs text-amber-300/60 mt-0.5">No description yet</p>}
        </div>
      ),
    },
    {
      key: "technologies", label: "Stack",
      render: (p) => (
        <div className="flex flex-wrap gap-1">
          {(p.technologies || []).slice(0, 4).map((t) => (
            <span key={t} className="rounded-md bg-violet-500/15 px-2 py-0.5 text-xs text-violet-300">{t}</span>
          ))}
        </div>
      ),
    },
    {
      key: "source", label: "Source", width: "90px",
      render: (p) => (
        <span className={`text-xs px-2 py-1 rounded-lg ${p.source === "github" ? "bg-cyan-500/15 text-cyan-300" : "bg-white/8 text-white/50"}`}>
          {p.source}
        </span>
      ),
    },
    {
      key: "featured", label: "Featured", width: "80px",
      render: (p) => (
        <button type="button" onClick={() => toggleFlag(p, "featured")} aria-pressed={p.featured}
          aria-label={p.featured ? `Unfeature ${p.title}` : `Feature ${p.title} on homepage`} title={p.featured ? "Featured" : "Not featured"}
          className="rounded-lg p-1.5 transition hover:bg-white/5">
          <Star size={16} className={p.featured ? "fill-amber-400 text-amber-400" : "text-white/20"} />
        </button>
      ),
    },
    {
      key: "visible", label: "Visible", width: "70px",
      render: (p) => (
        <button type="button" onClick={() => toggleFlag(p, "visible")} aria-pressed={p.visible}
          aria-label={p.visible ? `Hide ${p.title} from the public site` : `Show ${p.title} on the public site`} title={p.visible ? "Visible" : "Hidden"}
          className="rounded-lg p-1.5 transition hover:bg-white/5">
          {p.visible ? <Eye size={16} className="text-emerald-400" /> : <EyeOff size={16} className="text-white/20" />}
        </button>
      ),
    },
  ];

  const inp = (key: keyof typeof form, label: string, type = "text", placeholder = "") => (
    <div className="space-y-1.5">
      <label className="text-xs font-mono uppercase tracking-widest text-white/40">{label}</label>
      <input type={type} value={form[key] as string} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/50 transition"
      />
    </div>
  );

  return (
    <div className="px-4 py-6 sm:px-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-500/20 p-2.5"><FolderGit2 size={20} className="text-violet-400" /></div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/35">Portfolio CMS</p>
            <h1 className="text-2xl font-bold tracking-tight text-white">Projects <span className="text-white/30">({projects.length})</span></h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-white/8 overflow-hidden">
            <button type="button" onClick={() => setViewMode("table")} aria-label="Table view" aria-pressed={viewMode === "table"} className={`px-3 py-2 text-xs transition ${viewMode === "table" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}><Table2 size={14} /></button>
            <button type="button" onClick={() => setViewMode("order")} aria-label="Reorder view" aria-pressed={viewMode === "order"} className={`px-3 py-2 text-xs transition ${viewMode === "order" ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}><List size={14} /></button>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 shadow-lg shadow-violet-950/40 px-4 py-2.5 text-sm font-medium text-white hover:brightness-110 transition">
            <Plus size={15} /> Add Project
          </button>
        </div>
      </div>


      {viewMode === "table" ? (
        <DataTable
          columns={columns}
          data={projects}
          onEdit={openEdit}
          onDelete={handleDelete}
          loading={loading}
          error={loadError}
          onRetry={load}
          searchText={(p) => `${p.title} ${p.description} ${(p.technologies || []).join(" ")}`}
          rowLabel={(p) => p.title}
          emptyMessage="No projects yet. Add one, or import your repos from GitHub Sync."
        />
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-white/35">Drag to reorder. Order is reflected on the public portfolio.</p>
          <OrderableList
            items={projects}
            onReorder={handleReorder}
            renderItem={(p) => (
              <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.title}</p>
                  <p className="text-xs text-white/35 truncate">{(p.technologies || []).join(", ")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Star size={14} className={p.featured ? "fill-amber-400 text-amber-400" : "text-white/20"} />
                  {p.visible ? <Eye size={14} className="text-emerald-400" /> : <EyeOff size={14} className="text-white/20" />}
                </div>
              </div>
            )}
          />
        </div>
      )}

      <FormModal
        title={editing ? "Edit Project" : "Add Project"}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        loading={saving}
        size="lg"
      >
        {error && <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-300">{error}</div>}
        <div className="grid gap-4 md:grid-cols-2">
          {inp("title", "Title", "text", "My Awesome Project")}
          {inp("live_url", "Live URL", "url", "https://myproject.com")}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-mono uppercase tracking-widest text-white/40">Description</label>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3} placeholder="Describe your project…"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/50 transition resize-none"
          />
        </div>
        {inp("github_url", "GitHub URL", "url", "https://github.com/user/repo")}
        <TagInput value={form.technologies} onChange={(v) => setForm((f) => ({ ...f, technologies: v }))} label="Technologies" placeholder="React, TypeScript…" />
        <TagInput value={form.key_features} onChange={(v) => setForm((f) => ({ ...f, key_features: v }))} label="Key Features" placeholder="Real-time sync, Dark mode…" />
        <ImageUploader value={form.image_url} onChange={(url) => setForm((f) => ({ ...f, image_url: url }))} category="project" label="Cover Image" />
        <div className="flex items-center gap-6">
          <ToggleSwitch checked={form.featured} onChange={(v) => setForm((f) => ({ ...f, featured: v }))} label="Featured on homepage" />
          <ToggleSwitch checked={form.visible} onChange={(v) => setForm((f) => ({ ...f, visible: v }))} label="Visible" />
        </div>
      </FormModal>
    </div>
  );
}
