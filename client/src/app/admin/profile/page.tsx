"use client";

import { FormEvent, useEffect, useState } from "react";
import { getProfile, saveProfile, getToken } from "@/lib/adminApi";
import ImageUploader from "@/components/admin/ImageUploader";
import { Save, User } from "lucide-react";

interface Profile {
  full_name: string; title: string; tagline: string; bio: string;
  email: string; phone: string; location: string; brand_name: string;
  profile_image_url: string;
}

const emptyProfile: Profile = {
  full_name: "", title: "", tagline: "", bio: "",
  email: "", phone: "", location: "", brand_name: "", profile_image_url: "",
};

export default function ProfilePage() {
  const [form, setForm] = useState<Profile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [token, setToken] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [p, t] = await Promise.all([getProfile(), getToken()]);
        if (p.data) setForm(p.data as Profile);
        setToken(t);
      } catch { /* empty */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  function update(key: keyof Profile, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      await saveProfile(form);
      setMsg({ type: "success", text: "Profile saved successfully!" });
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to save." });
    } finally { setSaving(false); }
  }

  const input = (key: keyof Profile, label: string, type = "text", placeholder = "") => (
    <div className="space-y-1.5">
      <label className="text-xs font-mono uppercase tracking-widest text-white/40">{label}</label>
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => update(key, e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/3 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/50 transition"
      />
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-white/30 text-sm animate-pulse">Loading profile…</div>
  );

  return (
    <div className="px-4 py-6 sm:px-6 md:p-8 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-violet-500/20 p-2.5"><User size={20} className="text-violet-400" /></div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/35">Portfolio CMS</p>
          <h1 className="text-2xl font-bold tracking-tight text-white">Profile</h1>
        </div>
      </div>

      {msg.text && (
        <div className={`rounded-xl px-4 py-3 text-sm ${
          msg.type === "success" ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                                 : "bg-red-500/15 text-red-300 border border-red-500/20"
        }`}>{msg.text}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <ImageUploader
            value={form.profile_image_url}
            onChange={(url) => update("profile_image_url", url)}
            category="profile"
            label="Profile Photo"
            token={token}
          />
        </div>

        {/* Basic Info */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6 space-y-4">
          <p className="text-xs font-mono uppercase tracking-widest text-white/35">Basic Info</p>
          <div className="grid gap-4 md:grid-cols-2">
            {input("full_name", "Full Name", "text", "e.g. Rifqi Muhammad Aliya")}
            {input("brand_name", "Brand Name", "text", "e.g. @rifqi")}
          </div>
          {input("title", "Title / Role", "text", "e.g. Full-Stack Developer")}
          {input("tagline", "Tagline", "text", "e.g. Building things that matter")}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-widest text-white/40">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
              rows={4}
              placeholder="Write a short bio about yourself…"
              className="w-full rounded-xl border border-white/10 bg-white/3 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/50 transition resize-none"
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6 space-y-4">
          <p className="text-xs font-mono uppercase tracking-widest text-white/35">Contact Info</p>
          <div className="grid gap-4 md:grid-cols-2">
            {input("email", "Email", "email", "you@example.com")}
            {input("phone", "Phone", "tel", "+1 234 567 8900")}
          </div>
          {input("location", "Location", "text", "e.g. Jakarta, Indonesia")}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 shadow-lg shadow-violet-950/40 px-6 py-3 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Save size={15} />
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
