import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { enrollment_id } = await req.json();
  if (!enrollment_id) {
    return NextResponse.json({ error: "enrollment_id krävs" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: enrollment } = await admin
    .from("enrollments")
    .select("stripe_subscription_id, subscription_status")
    .eq("id", enrollment_id)
    .eq("student_id", user.id)
    .single();

  if (!enrollment) {
    return NextResponse.json({ error: "Enrollment hittades inte" }, { status: 404 });
  }
  if (!enrollment.stripe_subscription_id) {
    return NextResponse.json({ error: "Ingen aktiv prenumeration hittades" }, { status: 400 });
  }
  if (enrollment.subscription_status === "cancel_at_period_end" || enrollment.subscription_status === "canceled") {
    return NextResponse.json({ error: "Prenumerationen är redan avslutad" }, { status: 400 });
  }

  await getStripe().subscriptions.update(enrollment.stripe_subscription_id, {
    cancel_at_period_end: true,
  });

  await admin.from("enrollments").update({
    subscription_status: "cancel_at_period_end",
  }).eq("id", enrollment_id);

  return NextResponse.json({ ok: true });
}
