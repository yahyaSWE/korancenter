import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const adminClient = createAdminClient();
  const { data, error: err } = await adminClient
    .from("waitlist")
    .select("*, course:courses!course_id(id, title)")
    .order("created_at", { ascending: true });

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id krävs" }, { status: 400 });

  const adminClient = createAdminClient();
  const { error: err } = await adminClient.from("waitlist").delete().eq("id", id);

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
