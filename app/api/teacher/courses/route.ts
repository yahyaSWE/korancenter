import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/supabase/require-teacher";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { user, error } = await requireTeacher();
  if (error) return error;

  const admin = createAdminClient();

  const { data: courses, error: err } = await admin
    .from("courses")
    .select("*")
    .eq("teacher_id", user!.id)
    .order("created_at", { ascending: false });

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });

  // Räkna betalda elever per kurs
  const courseIds = (courses ?? []).map((c) => c.id);
  if (courseIds.length === 0) return NextResponse.json([]);

  const { data: enrollments } = await admin
    .from("enrollments")
    .select("course_id")
    .in("course_id", courseIds)
    .eq("payment_status", "paid");

  const counts = new Map<string, number>();
  for (const e of enrollments ?? []) {
    counts.set(e.course_id, (counts.get(e.course_id) ?? 0) + 1);
  }

  const enriched = (courses ?? []).map((c) => ({
    ...c,
    student_count: counts.get(c.id) ?? 0,
  }));

  return NextResponse.json(enriched);
}
