import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/supabase/require-teacher";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { user, error } = await requireTeacher();
  if (error) return error;

  const adminClient = createAdminClient();

  const { data, error: err } = await adminClient
    .from("messages")
    .select("*, sender:profiles!sender_id(id, full_name, email), recipient:profiles!recipient_id(id, full_name, email)")
    .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
    .order("created_at", { ascending: true })
    .limit(500);

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireTeacher();
  if (error) return error;

  const { recipient_id, subject, content } = await req.json();
  if (!recipient_id || !content) {
    return NextResponse.json({ error: "recipient_id och content krävs" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const { data, error: err } = await adminClient
    .from("messages")
    .insert({ sender_id: user!.id, recipient_id, subject: subject ?? null, content })
    .select("*, sender:profiles!sender_id(id, full_name, email), recipient:profiles!recipient_id(id, full_name, email)")
    .single();

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireTeacher();
  if (error) return error;

  const { id } = await req.json();
  const adminClient = createAdminClient();

  await adminClient
    .from("messages")
    .update({ is_read: true })
    .eq("id", id)
    .eq("recipient_id", user!.id);

  return NextResponse.json({ success: true });
}
