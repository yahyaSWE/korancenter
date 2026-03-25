import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  // Return both received and sent messages
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("messages")
    .select("*, sender:profiles!sender_id(id, full_name, email), recipient:profiles!recipient_id(id, full_name, email)")
    .or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { recipient_id, subject, content } = await req.json();
  if (!recipient_id || !content) {
    return NextResponse.json({ error: "recipient_id och content krävs" }, { status: 400 });
  }

  // Verify the recipient is the student's teacher (enrolled in same course)
  const adminClient = createAdminClient();

  const { data: enrollment } = await adminClient
    .from("enrollments")
    .select("course:courses!course_id(teacher_id)")
    .eq("student_id", user.id)
    .eq("payment_status", "paid")
    .limit(50);

  const teacherIds = (enrollment ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((e) => ((e.course as any)?.teacher_id as string | null))
    .filter(Boolean) as string[];

  if (!teacherIds.includes(recipient_id)) {
    return NextResponse.json({ error: "Du kan bara skicka till din lärare" }, { status: 403 });
  }

  const { data, error: err } = await adminClient
    .from("messages")
    .insert({ sender_id: user.id, recipient_id, subject: subject ?? null, content })
    .select()
    .single();

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { id } = await req.json();
  const adminClient = createAdminClient();
  await adminClient
    .from("messages")
    .update({ is_read: true })
    .eq("id", id)
    .eq("recipient_id", user.id);

  return NextResponse.json({ success: true });
}
