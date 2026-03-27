import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendApplicationStatusEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = createAdminClient();
  const { data, error: err } = await admin
    .from("applications")
    .select("*, course:courses!course_id(id, title), redirect_course:courses!redirect_course_id(id, title)")
    .order("created_at", { ascending: false });

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  const { error, user } = await requireAdmin();
  if (error) return error;

  const { id, status, redirect_course_id, admin_notes } = await req.json();
  if (!id || !["approved", "rejected", "redirected"].includes(status)) {
    return NextResponse.json({ error: "Ogiltiga parametrar" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: application } = await admin
    .from("applications")
    .select("*, course:courses!course_id(title), redirect_course:courses!redirect_course_id(title)")
    .eq("id", id)
    .single();

  if (!application) return NextResponse.json({ error: "Ansökan hittades inte" }, { status: 404 });

  const { error: updateErr } = await admin
    .from("applications")
    .update({
      status,
      redirect_course_id: status === "redirected" ? redirect_course_id : null,
      admin_notes: admin_notes ?? null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user!.id,
    })
    .eq("id", id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Send email to applicant
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
