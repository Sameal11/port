"use client";

import { useCallback, useEffect, useState } from "react";
import { getAnalytics } from "@/lib/adminApi";
import StatsCard from "@/components/admin/StatsCard";
import { BarChart3, Eye, Download, MousePointerClick, FolderGit2, Send } from "lucide-react";

interface AnalyticsData {
  totals: {
    page_views: number; resume_downloads: number; project_clicks: number;
    github_clicks: number; contact_submits: number;
  };
  daily: { date: string; page_views: number; total: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData((await getAnalytics()).data as AnalyticsData); } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const t = data?.totals;
  const daily = data?.daily || [];

  const maxViews = Math.max(...daily.map((d) => d.page_views), 1);

  return (
    <div className="px-4 py-6 sm:px-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-violet-500/20 p-2.5"><BarChart3 size={20} className="text-violet-400" /></div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/35">Portfolio CMS</p>
          <h1 className="text-2xl font-bold tracking-tight text-white">Analytics</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatsCard label="Page Views"       value={loading ? "—" : (t?.page_views ?? 0)}       icon={<Eye size={20} />}                 color="violet" />
        <StatsCard label="Resume Downloads" value={loading ? "—" : (t?.resume_downloads ?? 0)} icon={<Download size={20} />}            color="green" />
        <StatsCard label="Project Clicks"   value={loading ? "—" : (t?.project_clicks ?? 0)}   icon={<MousePointerClick size={20} />}   color="cyan" />
        <StatsCard label="GitHub Clicks"    value={loading ? "—" : (t?.github_clicks ?? 0)}    icon={<FolderGit2 size={20} />}              color="amber" />
        <StatsCard label="Contact Submits"  value={loading ? "—" : (t?.contact_submits ?? 0)}  icon={<Send size={20} />}                color="pink" />
      </div>

      {/* Daily chart */}
      {!loading && daily.length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <p className="text-xs font-mono uppercase tracking-widest text-white/35 mb-6">Daily Page Views (last 30 days)</p>
          <div className="flex items-end gap-1 h-40">
            {daily.map((d) => {
              const height = Math.max((d.page_views / maxViews) * 100, 2);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full">
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black border border-white/10 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap z-10">
                      {d.date}: {d.page_views} views
                    </div>
                    <div
                      className="w-full rounded-t bg-violet-500/60 hover:bg-violet-500 transition"
                      style={{ height: `${height * 0.01 * 160}px` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-xs text-white/25">
            <span>{daily[0]?.date}</span>
            <span>{daily[daily.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {!loading && daily.length === 0 && (
        <div className="rounded-2xl border border-white/8 bg-white/3 p-8 text-center">
          <p className="text-white/30 text-sm">No analytics data yet. Start getting traffic to see charts here.</p>
        </div>
      )}

      {/* Recent events table */}
      {!loading && daily.length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <p className="text-xs font-mono uppercase tracking-widest text-white/35 mb-4">Event Breakdown</p>
          <div className="space-y-3">
            {[
              { label: "Page Views",       count: t?.page_views ?? 0,       color: "bg-violet-500" },
              { label: "Resume Downloads", count: t?.resume_downloads ?? 0, color: "bg-emerald-500" },
              { label: "Project Clicks",   count: t?.project_clicks ?? 0,   color: "bg-cyan-500" },
              { label: "GitHub Clicks",    count: t?.github_clicks ?? 0,    color: "bg-amber-500" },
              { label: "Contact Submits",  count: t?.contact_submits ?? 0,  color: "bg-pink-500" },
            ].map(({ label, count, color }) => {
              const total = (t?.page_views ?? 0) + (t?.resume_downloads ?? 0) + (t?.project_clicks ?? 0) + (t?.github_clicks ?? 0) + (t?.contact_submits ?? 0);
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={label} className="flex items-center gap-4">
                  <span className="w-36 text-sm text-white/60 flex-shrink-0">{label}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/8">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-10 text-right text-sm text-white/60">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
