"use client";

import { ReactNode } from "react";
import { TrendingUp } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  color?: string;
  trend?: string;
}

export default function StatsCard({ label, value, icon, color = "violet", trend }: StatsCardProps) {
  const chip: Record<string, string> = {
    violet: "bg-violet-500/12 text-violet-300",
    cyan:   "bg-cyan-500/12 text-cyan-300",
    green:  "bg-emerald-500/12 text-emerald-300",
    amber:  "bg-amber-500/12 text-amber-300",
    pink:   "bg-pink-500/12 text-pink-300",
  };

  return (
    <div className="rounded-2xl border border-white/8 bg-[#0d0d0d]/80 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 break-words font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-white/40 sm:text-[11px] sm:tracking-[0.2em]">{label}</p>
        <div className={`flex-shrink-0 rounded-xl p-1.5 sm:p-2 ${chip[color] || chip.violet}`}>{icon}</div>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums text-white sm:text-3xl">{value}</p>
      {trend && (
        <p className="mt-1 flex items-center gap-1 text-xs text-white/50">
          <TrendingUp size={11} /> {trend}
        </p>
      )}
    </div>
  );
}
