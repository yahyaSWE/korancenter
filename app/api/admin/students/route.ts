import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { data, error: err } = await supabase!
    .from("profiles")
    .select("*")
    .in("role", ["student", "teacher"])
    .order("created_at", { ascending: false });

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { email, full_name, password } = await req.json();
  if (!email || !password)
    return NextResponse.json({ error: "E-post och lösenord krävs" }, { status: 400 });

  const adminClient = createAdminClient();
  const { data, error: createErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name ?? "" },
  });

  if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 });
  return NextResponse.json(data.user);
}

export async function PATCH(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id, role } = await req.json();
  if (!id || !["student", "teacher"].includes(role)) {
    return NextResponse.json({ error: "id och role (student/teacher) krävs" }, { status: 400 });
  }

  // Use admin client to bypass RLS on profiles
  const adminClient = createAdminClient();
  const { data, error: err } = await adminClient
    .from("profiles")
    .update({ role })
    .eq("id", id)
    .select()
    .single();

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await req.json();
  const adminClient = createAdminClient();
  const { error: deleteErr } = await adminClient.auth.admin.deleteUser(id);
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
