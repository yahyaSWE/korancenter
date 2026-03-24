import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";

export async function POST(req: NextRequest) {
  const { supabase, user, error } = await requireAdmin();
  if (error) return error;

  const { recipient_id, subject, content } = await req.json();
  if (!recipient_id || !content)
    return NextResponse.json({ error: "recipient_id och content krävs" }, { status: 400 });

  const { data, error: err } = await supabase!
    .from("messages")
    .insert({ sender_id: user!.id, recipient_id, subject: subject ?? null, content })
    .select()
    .single();

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function GET() {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { data, error: err } = await supabase!
    .from("messages")
    .select("*, sender:profiles!sender_id(full_name, email), recipient:profiles!recipient_id(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
