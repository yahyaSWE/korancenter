import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/supabase/require-teacher";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/teacher/students/[id]/progress
// Returnerar progress-rader för en elev över de kurser läraren undervisar
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireTeacher();
  if (error) return error;

  const { id: studentId } = await ctx.params;
  const admin = createAdminClient();

  const { data: courses } = await admin
    .from("courses")
    .select("id, title")
    .eq("teacher_id", user!.id);

  const courseIds = (courses ?? []).map((c) => c.id);
  if (courseIds.length === 0) return NextResponse.json([]);

  const { data, error: err } = await admin
    .from("student_progress")
    .select("*, course:courses!course_id(id, title)")
    .eq("student_id", studentId)
    .in("course_id", courseIds);

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/teacher/students/[id]/progress
// Upsertar progress för (student, course)
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireTeacher();
  if (error) return error;

  const { id: studentId } = await ctx.params;
  const { course_id, homework, last_lesson_summary, next_lesson_notes } = await req.json();

  if (!course_id || typeof course_id !== "string") {
    return NextResponse.json({ error: "course_id krävs" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verifiera att läraren faktiskt äger kursen
  const { data: course } = await admin
    .from("courses")
    .select("id, teacher_id")
    .eq("id", course_id)
    .single();

  if (!course || course.teacher_id !== user!.id) {
    // Tillåt också admin
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user!.id).single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Inte behörig att redigera denna kurs" }, { status: 403 });
    }
  }

  const { data, error: err } = await admin
    .from("student_progress")
    .upsert({
      student_id: studentId,
      course_id,
      teacher_id: user!.id,
      homework: homework ?? null,
      last_lesson_summary: last_lesson_summary ?? null,
      next_lesson_notes: next_lesson_notes ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "student_id,course_id" })
    .select("*, course:courses!course_id(id, title)")
    .single();

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data);
}
