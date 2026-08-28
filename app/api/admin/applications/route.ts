import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { runApprovalFlow } from "@/lib/approval";
import { attachPaymentStatuses } from "@/lib/application-payment";
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

  try {
    return NextResponse.json(await attachPaymentStatuses(data ?? []));
  } catch (paymentError) {
    const message = paymentError instanceof Error ? paymentError.message : "Kunde inte läsa betalningsstatus";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { error, user } = await requireAdmin();
  if (error) return error;

  const { id, status, redirect_course_id, admin_notes, expand_capacity } = await req.json();
  if (!id || !["approved", "rejected", "redirected"].includes(status)) {
    return NextResponse.json({ error: "Ogiltiga parametrar" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: application } = await admin
    .from("applications")
    .select("*, course:courses!course_id(id, title, stripe_price_id, is_subscription, is_active), redirect_course:courses!redirect_course_id(id, title)")
    .eq("id", id)
    .single();

  if (!application) return NextResponse.json({ error: "Ansökan hittades inte" }, { status: 404 });

  const result = await runApprovalFlow({
    application,
    status,
    reviewerId: user!.id,
    redirectCourseId: redirect_course_id,
    adminNotes: admin_notes,
    expandCapacity: expand_capacity === true,
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result);
}
