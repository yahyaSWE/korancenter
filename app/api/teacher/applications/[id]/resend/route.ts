import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/supabase/require-teacher";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendApprovalInstructions, type ApplicationWithCourse } from "@/lib/approval";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireTeacher();
  if (error) return error;

  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { data: application, error: applicationError } = await admin
    .from("applications")
    .select("*, course:courses!course_id(id, title, teacher_id, stripe_price_id, is_subscription, is_active)")
    .eq("id", id)
    .single();

  if (applicationError || !application) {
    return NextResponse.json({ error: "Ansökan hittades inte" }, { status: 404 });
  }
  if (application.status !== "approved") {
    return NextResponse.json({ error: "Ansökan är inte godkänd" }, { status: 400 });
  }

  const course = application.course as { teacher_id: string | null } | null;
  if (course?.teacher_id !== user!.id) {
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user!.id).single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Ej behörig" }, { status: 403 });
    }
  }

  try {
    const result = await sendApprovalInstructions(application as unknown as ApplicationWithCourse);
    return NextResponse.json({ ok: true, sent: true, ...result });
  } catch (sendError) {
    const message = sendError instanceof Error ? sendError.message : "Kunde inte skicka betalningslänken";
    console.error("[teacher-resend-approval]", sendError);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
