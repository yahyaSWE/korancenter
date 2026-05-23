import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { runApprovalFlow } from "@/lib/approval";
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

  const apps = data ?? [];

  // För godkända ansökningar — slå upp tillhörande enrollments betalningsstatus
  const approvedApps = apps.filter((a) => a.status === "approved" && a.email && a.course_id);
  if (approvedApps.length > 0) {
    const emails = Array.from(new Set(approvedApps.map((a) => a.email)));
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email")
      .in("email", emails);

    const emailToId = new Map<string, string>();
    for (const p of profiles ?? []) {
      if (p.email) emailToId.set(p.email, p.id);
    }

    const studentIds = Array.from(emailToId.values());
    const courseIds = Array.from(new Set(approvedApps.map((a) => a.course_id)));

    if (studentIds.length > 0 && courseIds.length > 0) {
      const { data: enrollments } = await admin
        .from("enrollments")
        .select("student_id, course_id, payment_status")
        .in("student_id", studentIds)
        .in("course_id", courseIds);

      const enrollMap = new Map<string, string>();
      for (const e of enrollments ?? []) {
        enrollMap.set(`${e.student_id}::${e.course_id}`, e.payment_status);
      }

      for (const app of apps) {
        if (app.status !== "approved") continue;
        const studentId = emailToId.get(app.email);
        if (!studentId) continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (app as any).payment_status = enrollMap.get(`${studentId}::${app.course_id}`) ?? null;
      }
    }
  }

  return NextResponse.json(apps);
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
    .select("*, course:courses!course_id(id, title, stripe_price_id, is_subscription), redirect_course:courses!redirect_course_id(id, title)")
    .eq("id", id)
    .single();

  if (!application) return NextResponse.json({ error: "Ansökan hittades inte" }, { status: 404 });

  const result = await runApprovalFlow({
    application,
    status,
    reviewerId: user!.id,
    redirectCourseId: redirect_course_id,
    adminNotes: admin_notes,
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true });
}
