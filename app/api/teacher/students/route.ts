import { NextResponse } from "next/server";
import { requireTeacher } from "@/lib/supabase/require-teacher";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { user, error } = await requireTeacher();
  if (error) return error;

  const adminClient = createAdminClient();

  // Get courses taught by this teacher
  const { data: courses } = await adminClient
    .from("courses")
    .select("id, title")
    .eq("teacher_id", user!.id);

  if (!courses || courses.length === 0) {
    return NextResponse.json([]);
  }

  const courseIds = courses.map((c) => c.id);

  // Get enrollments for those courses
  const { data: enrollments, error: err } = await adminClient
    .from("enrollments")
    .select("*, student:profiles!student_id(id, full_name, email, created_at), course:courses!course_id(id, title)")
    .in("course_id", courseIds)
    .eq("payment_status", "paid");

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(enrollments ?? []);
}
