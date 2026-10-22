"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  LayoutDashboard,
  User,
  FolderGit2,
  FolderOpen,
  Award,
  Layers,
  Briefcase,
  GraduationCap,
  Trophy,
  Share2,
  FileText,
  Layout,
  Palette,
  Image,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/dashboard",       label: "Dashboard",       icon: LayoutDashboard },
  { href: "/admin/profile",         label: "Profile",         icon: User },
  { href: "/admin/projects",        label: "Projects",        icon: FolderGit2 },
  { href: "/admin/github",          label: "GitHub Sync",     icon: FolderOpen },
  { href: "/admin/certifications",  label: "Certifications",  icon: Award },
  { href: "/admin/tech-stack",      label: "Tech Stack",      icon: Layers },
  { href: "/admin/experience",      label: "Experience",      icon: Briefcase },
  { href: "/admin/education",       label: "Education",       icon: GraduationCap },
  { href: "/admin/achievements",    label: "Achievements",    icon: Trophy },
  { href: "/admin/social-links",    label: "Social Links",    icon: Share2 },
  { href: "/admin/resume",          label: "Resume Builder",  icon: FileText },
  { href: "/admin/homepage",        label: "Homepage Builder", icon: Layout },
  { href: "/admin/theme",           label: "Theme",           icon: Palette },
  { href: "/admin/media",           label: "Media Library",   icon: Image },
  { href: "/admin/analytics",       label: "Analytics",       icon: BarChart3 },
];

function currentLabel(pathname: string) {
  return NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"))?.label ?? "Admin";
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Close the mobile drawer whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMobileOpen(false);
  }

  // Lock page scroll and allow Esc while the drawer is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  // On mobile the drawer always shows labels, whatever the desktop rail state.
  const compact = collapsed && !mobileOpen;

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/8 bg-[#0a0a0a]/90 px-4 py-3 backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-xl border border-white/10 p-2 text-white/70 hover:text-white"
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
        >
          <Menu size={18} />
        </button>
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/35">CMS</span>
        <span className="truncate text-sm font-semibold text-white">{currentLabel(pathname)}</span>
      </header>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/8 bg-[#0a0a0a] transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 md:transition-[width] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${compact ? "md:w-[68px]" : "md:w-64"}`}
        aria-label="Admin navigation"
      >
        {/* Brand */}
        <div className="flex items-center gap-3 border-b border-white/8 px-4 py-5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 font-mono text-[11px] font-medium text-white">
            CMS
          </div>
          {!compact && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">Portfolio CMS</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/35">Content manager</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-white/50 hover:text-white md:hidden"
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        {/* Collapse toggle (desktop) */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-[68px] z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-[#111] text-white/60 transition hover:text-white md:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-white/[0.07] text-white font-medium"
                    : "text-white/50 hover:bg-white/5 hover:text-white/90"
                }`}
                title={compact ? label : undefined}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-400 to-cyan-400" />
                )}
                <Icon size={16} className={`flex-shrink-0 ${active ? "text-violet-300" : ""}`} />
                {!compact && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="space-y-0.5 border-t border-white/8 p-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/45 transition hover:bg-white/5 hover:text-white/80"
            title={compact ? "View portfolio" : undefined}
          >
            <ExternalLink size={16} className="flex-shrink-0" />
            {!compact && <span>View portfolio</span>}
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/45 transition hover:bg-red-500/10 hover:text-red-400"
            title={compact ? "Sign out" : undefined}
          >
            <LogOut size={16} className="flex-shrink-0" />
            {!compact && <span>{signingOut ? "Signing out…" : "Sign out"}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
