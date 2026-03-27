import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendApplicationStatusEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

async function getTeacher() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Ej inloggad" }, { status: 401 }), user: null };

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "teacher" && profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Ej behörig" }, { status: 403 }), user: null };
  }
  return { error: null, user };
}

export async function GET() {
  const { error, user } = await getTeacher();
  if (error) return error;

  const admin = createAdminClient();

  // Get courses taught by this teacher
  const { data: courses } = await admin
    .from("courses")
    .select("id")
    .eq("teacher_id", user!.id);

  const courseIds = (courses ?? []).map((c) => c.id);
  if (courseIds.length === 0) return NextResponse.json([]);

  const { data, error: err } = await admin
    .from("applications")
    .select("*, course:courses!course_id(id, title), redirect_course:courses!redirect_course_id(id, title)")
    .in("course_id", courseIds)
    .order("created_at", { ascending: false });

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  const { error, user } = await getTeacher();
  if (error) return error;

  const { id, status, redirect_course_id, admin_notes } = await req.json();
  if (!id || !["approved", "rejected", "redirected"].includes(status)) {
    return NextResponse.json({ error: "Ogiltiga parametrar" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Verify teacher owns this course
  const { data: application } = await admin
    .from("applications")
    .select("*, course:courses!course_id(id, title, teacher_id), redirect_course:courses!redirect_course_id(title)")
    .eq("id", id)
    .single();

  if (!application) return NextResponse.json({ error: "Ansökan hittades inte" }, { status: 404 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((application as any).course?.teacher_id !== user!.id) {
    return NextResponse.json({ error: "Ej behörig" }, { status: 403 });
  }

  await admin.from("applications").update({
    status,
    redirect_course_id: status === "redirected" ? redirect_course_id : null,
    admin_notes: admin_notes ?? null,
    reviewed_at: new Date().toISOString(),
    reviewed_by: user!.id,
  }).eq("id", id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const redirectName = (application as any).redirect_course?.title;
  await sendApplicationStatusEmail({
    toEmail: application.email,
    applicantName: application.name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    courseName: (application as any).course?.title ?? "",
    status,
    redirectCourseName: redirectName,
    notes: admin_notes,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
