"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAnalytics, getProjects, getCertifications } from "@/lib/adminApi";
import StatsCard from "@/components/admin/StatsCard";
import {
  FolderGit2, Star, Award, Download, Eye, MousePointerClick, Send, FolderOpen,
  CheckCircle2, CircleAlert, ArrowUpRight,
} from "lucide-react";

type ProjectSummary = {
  featured: boolean;
  visible: boolean;
  description: string | null;
  image_url: string | null;
};

interface Analytics {
  totals: {
    page_views: number;
    resume_downloads: number;
    project_clicks: number;
    github_clicks: number;
    contact_submits: number;
  };
  daily: { date: string; page_views: number; total: number }[];
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [projectCount, setProjectCount] = useState(0);
  const [featuredCount, setFeaturedCount] = useState(0);
  const [certCount, setCertCount] = useState(0);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [a, p, c] = await Promise.all([
          getAnalytics(),
          getProjects(),
          getCertifications(),
        ]);
        setAnalytics(a.data as Analytics);
        const rows = p.data as ProjectSummary[];
        setProjects(rows);
        setProjectCount(rows.length);
        setFeaturedCount(rows.filter((p) => p.featured).length);
        setCertCount((c.data as unknown[]).length);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't load the dashboard.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const t = analytics?.totals;
  const daily = analytics?.daily || [];

  const recent = daily.slice(-14);
  const max = Math.max(...recent.map((d) => d.page_views), 1);

  // Actionable checklist: what still needs attention before sharing the site.
  const visible = projects.filter((p) => p.visible);
  const health = [
    {
      ok: featuredCount >= 3 && featuredCount <= 6,
      text: `${featuredCount} featured project${featuredCount === 1 ? "" : "s"}`,
      hint: "Aim for 3–6 so the homepage leads with your strongest work.",
    },
    {
      ok: visible.every((p) => p.description?.trim()),
      text: `${visible.filter((p) => !p.description?.trim()).length} visible project(s) without a description`,
      hint: "Recruiters skim descriptions first. Add one line on the problem it solves.",
    },
    {
      ok: visible.every((p) => p.image_url),
      text: `${visible.filter((p) => !p.image_url).length} visible project(s) without a cover image`,
      hint: "Without an image the card falls back to a GitHub preview, which can fail to load.",
    },
    {
      ok: true,
      text: `${projects.length - visible.length} hidden project(s)`,
      hint: "Hidden projects stay in the CMS but never appear on the public site.",
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/35 mb-1">Overview</p>
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-white/45">What visitors see, and what still needs your attention.</p>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatsCard label="Total Projects"     value={loading ? "—" : projectCount}           icon={<FolderGit2 size={18} />}    color="violet" />
        <StatsCard label="Featured Projects"  value={loading ? "—" : featuredCount}          icon={<Star size={18} />}           color="amber" />
        <StatsCard label="Certifications"     value={loading ? "—" : certCount}              icon={<Award size={18} />}          color="cyan" />
        <StatsCard label="Resume Downloads"   value={loading ? "—" : (t?.resume_downloads ?? 0)} icon={<Download size={18} />}  color="green" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatsCard label="Page Views"         value={loading ? "—" : (t?.page_views ?? 0)}      icon={<Eye size={18} />}             color="violet" />
        <StatsCard label="Project Clicks"     value={loading ? "—" : (t?.project_clicks ?? 0)}  icon={<MousePointerClick size={18} />} color="pink" />
        <StatsCard label="GitHub Clicks"      value={loading ? "—" : (t?.github_clicks ?? 0)}   icon={<FolderOpen size={18} />}          color="amber" />
        <StatsCard label="Contact Submits"    value={loading ? "—" : (t?.contact_submits ?? 0)} icon={<Send size={18} />}            color="green" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Page views per day */}
        <section className="rounded-2xl border border-white/8 bg-[#0d0d0d]/80 p-5 sm:p-6" aria-labelledby="views-heading">
          <p id="views-heading" className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">Page views · last 14 days</p>
          {loading ? (
            <div className="mt-4 h-32 animate-pulse rounded-xl bg-white/[0.03]" />
          ) : recent.length < 2 ? (
            <p className="mt-4 rounded-xl border border-dashed border-white/12 px-4 py-8 text-center text-sm text-white/45">
              {recent.length === 0 ? "No visits recorded yet." : `${recent[0].page_views} view(s) on ${recent[0].date}.`} The chart fills in once there are two or more days of visits.
            </p>
          ) : (
            <>
              <div className="mt-4 flex h-32 items-end gap-1.5" role="img" aria-label={`Page views per day, peak ${max}`}>
                {recent.map((d) => (
                  <div key={d.date} className="group relative flex h-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-violet-600/70 to-cyan-500/70 transition group-hover:from-violet-500 group-hover:to-cyan-400"
                      style={{ height: `${Math.max((d.page_views / max) * 100, 3)}%` }}
                    />
                    <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-1.5 py-0.5 font-mono text-[10px] text-white opacity-0 group-hover:opacity-100">
                      {d.page_views}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between font-mono text-[10px] text-white/30">
                <span>{recent[0]?.date}</span>
                <span>{recent[recent.length - 1]?.date}</span>
              </div>
            </>
          )}
        </section>

        {/* Content health */}
        <section className="rounded-2xl border border-white/8 bg-[#0d0d0d]/80 p-5 sm:p-6" aria-labelledby="health-heading">
          <div className="flex items-center justify-between gap-3">
            <p id="health-heading" className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">Content health</p>
            <Link href="/admin/projects" className="flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200">
              Fix in Projects <ArrowUpRight size={12} />
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {health.map((item) => (
              <li key={item.text} className="flex gap-3">
                {loading ? (
                  <span className="mt-0.5 h-4 w-4 flex-shrink-0 animate-pulse rounded-full bg-white/10" />
                ) : item.ok ? (
                  <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-emerald-400" aria-label="OK" />
                ) : (
                  <CircleAlert size={16} className="mt-0.5 flex-shrink-0 text-amber-400" aria-label="Needs attention" />
                )}
                <div>
                  <p className="text-sm text-white/85">{loading ? "Checking…" : item.text}</p>
                  <p className="text-xs leading-relaxed text-white/40">{item.hint}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Quick links */}
      <div className="rounded-2xl border border-white/8 bg-[#0d0d0d]/80 p-5 sm:p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40 mb-4">Quick actions</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Edit Profile",    href: "/admin/profile" },
            { label: "Add Project",     href: "/admin/projects" },
            { label: "Sync GitHub",     href: "/admin/github" },
            { label: "Build Resume",    href: "/admin/resume" },
            { label: "Manage Theme",    href: "/admin/theme" },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-center text-sm text-white/65 transition hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-200"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
