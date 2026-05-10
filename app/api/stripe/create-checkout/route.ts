import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { enrollment_id } = await req.json();
  if (!enrollment_id) {
    return NextResponse.json({ error: "enrollment_id krävs" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: enrollment } = await admin
    .from("enrollments")
    .select("id, course:courses!course_id(title, stripe_price_id, is_subscription), student:profiles!student_id(email, full_name)")
    .eq("id", enrollment_id)
    .single();

  if (!enrollment) {
    return NextResponse.json({ error: "Enrollment hittades inte" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const course = enrollment.course as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const student = enrollment.student as any;

  if (!course?.stripe_price_id) {
    return NextResponse.json({ error: "Kursen saknar Stripe-pris-ID. Lägg till det under Kurser." }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: course.is_subscription ? "subscription" : "payment",
    customer_email: student?.email ?? undefined,
    line_items: [{ price: course.stripe_price_id, quantity: 1 }],
    success_url: `${siteUrl}/bekraftelse?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/kurser`,
    metadata: { enrollment_id },
    allow_promotion_codes: true,
    ...(course.is_subscription
      ? { subscription_data: { metadata: { enrollment_id } } }
      : {}),
  });

  return NextResponse.json({ url: session.url });
}
