import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminToaster from "@/components/admin/AdminToaster";
import type { ReactNode } from "react";

export const metadata = {
  title: "Admin — Portfolio CMS",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await getSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) redirect("/login");

  return (
    <div className="admin-shell min-h-screen text-white md:flex">
      <AdminSidebar />
      <main className="admin-panel min-w-0 flex-1">
        {children}
      </main>
      <AdminToaster />
    </div>
  );
}
