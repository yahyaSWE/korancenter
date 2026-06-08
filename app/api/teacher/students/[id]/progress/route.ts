import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/supabase/require-teacher";
import { createAdminClient } from "@/lib/supabase/admin";

async function teacherCourseIds(teacherId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data: courses } = await admin
    .from("courses")
    .select("id")
    .eq("teacher_id", teacherId);
  return (courses ?? []).map((c) => c.id);
}

async function isAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("role").eq("id", userId).single();
  return data?.role === "admin";
}

// GET — hela historiken av anteckningar för en elev över lärarens kurser
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireTeacher();
  if (error) return error;

  const { id: studentId } = await ctx.params;
  const admin = createAdminClient();

  const courseIds = await teacherCourseIds(user!.id);
  const adminUser = await isAdmin(user!.id);

  let query = admin
    .from("lesson_notes")
    .select("*, course:courses!course_id(id, title)")
    .eq("student_id", studentId)
    .order("lesson_date", { ascending: false })
    .order("created_at", { ascending: false });

  // Admins ser alla kurser; lärare bara sina egna
  if (!adminUser) {
    if (courseIds.length === 0) return NextResponse.json([]);
    query = query.in("course_id", courseIds);
  }

  const { data, error: err } = await query;
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST — lägg till en ny anteckning (en post per lektion, append-only)
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireTeacher();
  if (error) return error;

  const { id: studentId } = await ctx.params;
  const { course_id, lesson_date, summary, homework, notes } = await req.json();

  if (!course_id || typeof course_id !== "string") {
    return NextResponse.json({ error: "course_id krävs" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verifiera behörighet: läraren äger kursen, eller admin
  const { data: course } = await admin
    .from("courses")
    .select("id, teacher_id")
    .eq("id", course_id)
    .single();

  if (!course || (course.teacher_id !== user!.id && !(await isAdmin(user!.id)))) {
    return NextResponse.json({ error: "Inte behörig att redigera denna kurs" }, { status: 403 });
  }

  const { data, error: err } = await admin
    .from("lesson_notes")
    .insert({
      student_id: studentId,
      course_id,
      teacher_id: user!.id,
      lesson_date: lesson_date || undefined,
      summary: summary?.trim() || null,
      homework: homework?.trim() || null,
      notes: notes?.trim() || null,
    })
    .select("*, course:courses!course_id(id, title)")
    .single();

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — ta bort en anteckning (?note_id=...)
export async function DELETE(req: NextRequest) {
  const { user, error } = await requireTeacher();
  if (error) return error;

  const noteId = new URL(req.url).searchParams.get("note_id");
  if (!noteId) return NextResponse.json({ error: "note_id krävs" }, { status: 400 });

  const admin = createAdminClient();
  const { data: note } = await admin
    .from("lesson_notes")
    .select("id, course:courses!course_id(teacher_id)")
    .eq("id", noteId)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownerId = (note as any)?.course?.teacher_id as string | undefined;
  if (!note || (ownerId !== user!.id && !(await isAdmin(user!.id)))) {
    return NextResponse.json({ error: "Inte behörig" }, { status: 403 });
  }

  const { error: err } = await admin.from("lesson_notes").delete().eq("id", noteId);
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
