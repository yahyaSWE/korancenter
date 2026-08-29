import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendApprovalInstructions, type ApplicationWithCourse } from "@/lib/approval";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { data: application, error: applicationError } = await admin
    .from("applications")
    .select("*, course:courses!course_id(id, title, stripe_price_id, is_subscription, is_active)")
    .eq("id", id)
    .single();

  if (applicationError || !application) {
    return NextResponse.json({ error: "Ansökan hittades inte" }, { status: 404 });
  }
  if (application.status !== "approved") {
    return NextResponse.json({ error: "Ansökan är inte godkänd" }, { status: 400 });
  }

  try {
    const result = await sendApprovalInstructions(application as unknown as ApplicationWithCourse);
    return NextResponse.json({ ok: true, sent: true, ...result });
  } catch (sendError) {
    const message = sendError instanceof Error ? sendError.message : "Kunde inte skicka betalningslänken";
    console.error("[admin-resend-approval]", sendError);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
