import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { course_id } = await req.json();
  if (!course_id) return NextResponse.json({ error: "course_id krävs" }, { status: 400 });

  const admin = createAdminClient();

  const { data: course } = await admin
    .from("courses")
    .select("id, title, max_participants, is_active")
    .eq("id", course_id)
    .eq("is_active", true)
    .single();

  if (!course) return NextResponse.json({ error: "Kursen finns inte" }, { status: 404 });

  // Already enrolled?
  const { data: existing } = await admin
    .from("enrollments")
    .select("id")
    .eq("student_id", user.id)
    .eq("course_id", course_id)
    .neq("payment_status", "cancelled")
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "Du är redan anmäld till denna kurs" }, { status: 400 });

  // Check capacity
  if (course.max_participants) {
    const { count } = await admin
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("course_id", course_id)
      .eq("payment_status", "paid");

    if ((count ?? 0) >= course.max_participants) {
      return NextResponse.json({ error: "Kursen är fullbokad" }, { status: 400 });
    }
  }

  const { data, error } = await admin
    .from("enrollments")
    .insert({ student_id: user.id, course_id, payment_status: "pending" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
