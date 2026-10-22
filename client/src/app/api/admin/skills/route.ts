import { NextRequest, NextResponse } from "next/server";
import {
  getAllowedAdminEmails,
  getSupabaseAdminClient,
  getSupabaseServerClient,
} from "@/lib/supabase/server";

function toStringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toOptionalString(value: unknown) {
  const normalized = toStringValue(value);
  return normalized || null;
}

async function requireAdmin() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const allowedEmails = getAllowedAdminEmails();
  const email = session.user.email?.toLowerCase() || "";

  if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  return null;
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin();

  if (authError) {
    return authError;
  }

  const body = await request.json();
  const name = toStringValue(body.name);

  if (!name) {
    return NextResponse.json(
      { error: "Skill name is required." },
      { status: 400 }
    );
  }

  const payload = {
    name,
    logo_url: toOptionalString(body.logo_url),
  };

  const adminClient = getSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("tech_stack")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
