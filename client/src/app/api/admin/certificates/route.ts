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
  const title = toStringValue(body.title);

  if (!title) {
    return NextResponse.json(
      { error: "Title is required." },
      { status: 400 }
    );
  }

  const payload = {
    title,
    image_url: toOptionalString(body.image_url),
  };

  const adminClient = getSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("certifications")
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
