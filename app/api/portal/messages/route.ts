import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:profiles!sender_id(id, full_name, email)")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { id } = await req.json();
  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("id", id)
    .eq("recipient_id", user.id);

  return NextResponse.json({ success: true });
}
