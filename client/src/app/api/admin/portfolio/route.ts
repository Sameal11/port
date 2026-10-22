import { NextResponse } from "next/server";
import {
  getAllowedAdminEmails,
  getSupabaseAdminClient,
  getSupabaseServerClient,
} from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
      session: null,
    };
  }

  const allowedEmails = getAllowedAdminEmails();
  const email = session.user.email?.toLowerCase() || "";

  if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
    return {
      error: NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}

export async function GET() {
  const auth = await requireAdmin();

  if (auth.error) {
    return auth.error;
  }

  const adminClient = getSupabaseAdminClient();

  const [projectsResult, certificatesResult, skillsResult] =
    await Promise.all([
      adminClient
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false }),
      adminClient
        .from("certifications")
        .select("*")
        .order("created_at", { ascending: false }),
      adminClient
        .from("tech_stack")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

  const firstError =
    projectsResult.error ||
    certificatesResult.error ||
    skillsResult.error;

  if (firstError) {
    return NextResponse.json(
      { error: firstError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: {
      projects: projectsResult.data || [],
      certificates: certificatesResult.data || [],
      skills: skillsResult.data || [],
    },
  });
}
