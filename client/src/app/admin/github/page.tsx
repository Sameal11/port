"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { syncGithub, getSettings, saveSetting, getProjects, updateProject, getSettingsEncryptionStatus } from "@/lib/adminApi";
import { FolderOpen, RefreshCw, Key, FolderGit2, Save, CheckCircle, AlertCircle } from "lucide-react";
import ToggleSwitch from "@/components/admin/ToggleSwitch";

interface Project {
  id: string; title: string; description: string;
  github_url: string; technologies: string[]; key_features?: string[];
  featured: boolean; visible: boolean; source: string;
}

export default function GithubSyncPage() {
  const [pat, setPat] = useState("");
  const [username, setUsername] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; upserted: number } | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [patAlreadySet, setPatAlreadySet] = useState(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState<boolean | null>(null);

  // The server never sends the real token back down — it sends the sentinel
  // "__SET__" if one exists. We show a placeholder instead of that sentinel,
  // and only submit a new "pat" value if the user actually typed one.
  const PAT_SENTINEL = "__SET__";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [settings, p, encStatus] = await Promise.all([
        getSettings(),
        getProjects(),
        getSettingsEncryptionStatus(),
      ]);
      const storedPat = settings.data.github_pat || "";
      setPatAlreadySet(storedPat === PAT_SENTINEL);
      setPat(storedPat === PAT_SENTINEL ? "" : storedPat);
      setUsername(settings.data.github_username || "");
      setProjects((p.data as Project[]).filter((x) => x.source === "github"));
      setEncryptionEnabled(encStatus.encrypted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSaveSettings(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const saves = [saveSetting("github_username", username)];
      // Only overwrite the stored token if the user typed a new one — an
      // empty field just means "leave the existing token alone."
      if (pat.trim()) saves.push(saveSetting("github_pat", pat));
      await Promise.all(saves);
      setSuccessMsg("Settings saved successfully!");
      if (pat.trim()) { setPatAlreadySet(true); setPat(""); }
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally { setSaving(false); }
  }

  async function handleSync() {
    if (!username.trim()) {
      setError("Please enter your GitHub username and save settings first.");
      return;
    }
    setSyncing(true);
    setError("");
    setSyncResult(null);
    setSuccessMsg("");
    try {
      // Save settings first to ensure username/pat are persisted in DB
      await Promise.all([
        saveSetting("github_pat", pat),
        saveSetting("github_username", username),
      ]);
      const r = await syncGithub(pat || undefined);
      const d = r.data as { synced: number; upserted: number };
      setSyncResult(d);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sync failed";
      setError(msg);
    } finally { setSyncing(false); }
  }

  async function toggleFeatured(p: Project) {
    await updateProject(p.id, { featured: !p.featured });
    setProjects((prev) => prev.map((x) => x.id === p.id ? { ...x, featured: !x.featured } : x));
  }

  async function toggleVisible(p: Project) {
    await updateProject(p.id, { visible: !p.visible });
    setProjects((prev) => prev.map((x) => x.id === p.id ? { ...x, visible: !x.visible } : x));
  }

  return (
    <div className="px-4 py-6 sm:px-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-white/10 p-2.5"><FolderGit2 size={20} className="text-white" /></div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/35">Portfolio CMS</p>
          <h1 className="text-2xl font-bold tracking-tight text-white">GitHub Sync</h1>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle size={16} className="flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {syncResult && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle size={16} className="flex-shrink-0" />
          <span>✓ Synced {syncResult.synced} repositories ({syncResult.upserted} upserted/updated).</span>
        </div>
      )}

      {/* Settings */}
      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <p className="text-xs font-mono uppercase tracking-widest text-white/35 mb-4">GitHub Configuration</p>
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-widest text-white/40">GitHub Username *</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your-github-username"
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/50 transition"
            />
            <p className="text-xs text-white/25">Required for syncing public repositories.</p>
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-white/40">
              <Key size={11} /> Personal Access Token (optional — for private repos)
            </label>
            <input
              type="password"
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              placeholder={patAlreadySet ? "•••••••••••••••••••• (leave blank to keep current token)" : "ghp_xxxxxxxxxxxxxxxxxxxx"}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/50 transition font-mono"
            />
            <p className="text-xs text-white/25">
              Token needs <code className="text-white/40">repo</code> scope for private repos.{" "}
              {encryptionEnabled === null
                ? null
                : encryptionEnabled
                ? "Stored encrypted at rest."
                : "⚠ Stored in plain text — set SETTINGS_ENCRYPTION_KEY on the server to encrypt it."}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 disabled:opacity-50 transition"
            >
              <Save size={14} />
              {saving ? "Saving…" : "Save Settings"}
            </button>
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing || !username.trim()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 shadow-lg shadow-violet-950/40 px-5 py-2.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing…" : "Sync Repositories"}
            </button>
          </div>
          {!username.trim() && (
            <p className="text-xs text-amber-400/70">⚠ Enter your GitHub username above to enable sync.</p>
          )}
        </form>
      </div>

      {/* Synced Repos */}
      <div className="space-y-3">
        <p className="text-xs font-mono uppercase tracking-widest text-white/35">
          Synced Repositories ({projects.length})
        </p>
        {loading ? (
          <p className="text-sm text-white/30 animate-pulse">Loading…</p>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-white/8 bg-white/2 px-4 py-6 text-center">
            <FolderOpen size={24} className="mx-auto mb-2 text-white/20" />
            <p className="text-sm text-white/30">No GitHub repos synced yet.</p>
            <p className="text-xs text-white/20 mt-1">Enter your username above and click &quot;Sync Repositories&quot;.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {projects.map((p) => (
              <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/3 px-4 py-3">
                <FolderGit2 size={16} className="text-white/40 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.title}</p>
                  <p className="text-xs text-white/40 truncate">{p.github_url}</p>
                  {p.technologies?.length > 0 && (
                    <p className="text-xs text-white/30 mt-0.5">{p.technologies.join(", ")}</p>
                  )}
                  {p.key_features && p.key_features.length > 0 && (
                    <div className="mt-2 rounded-lg border border-violet-400/15 bg-violet-500/5 px-2.5 py-2">
                      <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-violet-200/60">Resume bullets</p>
                      <ul className="space-y-1 text-xs leading-relaxed text-white/55">
                        {p.key_features.map((bullet, index) => (
                          <li key={`${p.id}-bullet-${index}`} className="flex gap-1.5">
                            <span className="text-violet-300">•</span>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <ToggleSwitch
                    checked={p.featured}
                    onChange={() => toggleFeatured(p)}
                    size="sm"
                  />
                  <span className="text-xs text-white/30">Featured</span>
                  <ToggleSwitch
                    checked={p.visible}
                    onChange={() => toggleVisible(p)}
                    size="sm"
                  />
                  <span className="text-xs text-white/30">Visible</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
