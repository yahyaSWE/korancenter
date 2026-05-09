import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("messages")
    .select("*, sender:profiles!sender_id(id, full_name, email), recipient:profiles!recipient_id(id, full_name, email)")
    .or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { recipient_id, subject, content } = await req.json();
  if (!recipient_id || typeof recipient_id !== "string" || !content || typeof content !== "string" || content.trim() === "") {
    return NextResponse.json({ error: "recipient_id och content krävs" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Tillåt skicka till: enrollerade lärare ELLER någon som tidigare skickat meddelande till eleven
  const [enrollmentRes, senderHistoryRes] = await Promise.all([
    adminClient
      .from("enrollments")
      .select("course:courses!course_id(teacher_id)")
      .eq("student_id", user.id)
      .eq("payment_status", "paid"),
    adminClient
      .from("messages")
      .select("sender_id")
      .eq("recipient_id", user.id),
  ]);

  const teacherIds = (enrollmentRes.data ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((e) => ((e.course as any)?.teacher_id as string | null))
    .filter(Boolean) as string[];

  const previousSenderIds = (senderHistoryRes.data ?? []).map((m) => m.sender_id);

  const allowedRecipients = new Set([...teacherIds, ...previousSenderIds]);

  if (!allowedRecipients.has(recipient_id)) {
    return NextResponse.json({ error: "Du kan bara skicka meddelanden till din lärare" }, { status: 403 });
  }

  const { data, error: err } = await adminClient
    .from("messages")
    .insert({ sender_id: user.id, recipient_id, subject: subject?.trim() || null, content: content.trim() })
    .select("*, sender:profiles!sender_id(id, full_name, email), recipient:profiles!recipient_id(id, full_name, email)")
    .single();

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id krävs" }, { status: 400 });

  const adminClient = createAdminClient();
  await adminClient
    .from("messages")
    .update({ is_read: true })
    .eq("id", id)
    .eq("recipient_id", user.id);

  return NextResponse.json({ success: true });
}
