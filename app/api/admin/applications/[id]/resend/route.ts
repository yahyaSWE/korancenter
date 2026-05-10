import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendApprovalEmail } from "@/lib/email";
import { getStripe } from "@/lib/stripe";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await ctx.params;
  const admin = createAdminClient();

  const { data: application } = await admin
    .from("applications")
    .select("*, course:courses!course_id(id, title, stripe_price_id, is_subscription)")
    .eq("id", id)
    .single();

  if (!application) {
    return NextResponse.json({ error: "Ansökan hittades inte" }, { status: 404 });
  }
  if (application.status !== "approved") {
    return NextResponse.json({ error: "Ansökan är inte godkänd" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const course = (application as any).course as { id: string; title: string; stripe_price_id: string | null; is_subscription: boolean } | null;
  if (!course?.id) {
    return NextResponse.json({ error: "Kursen saknas" }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Hitta eller skapa profil + generera lösenordslänk
  let studentId: string | null = null;
  let passwordSetupLink: string | null = null;
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("email", application.email)
    .maybeSingle();

  if (existing) {
    studentId = existing.id;
    // Användaren finns redan — skicka recovery-länk så de kan sätta/återställa lösenord
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: application.email,
      options: { redirectTo: `${siteUrl}/api/auth/callback?next=/portal/nytt-losenord` },
    });
    passwordSetupLink = linkData?.properties?.action_link ?? null;
  } else {
    // Skapa konto via invite (ger samtidigt en länk där de kan sätta lösenord)
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "invite",
      email: application.email,
      options: {
        data: { full_name: application.name },
        redirectTo: `${siteUrl}/api/auth/callback?next=/portal/nytt-losenord`,
      },
    });
    if (linkErr || !linkData?.user) {
      return NextResponse.json({ error: "Kunde inte skapa konto: " + (linkErr?.message ?? "okänt fel") }, { status: 500 });
    }
    studentId = linkData.user.id;
    passwordSetupLink = linkData.properties?.action_link ?? null;
    await admin.from("profiles").update({ full_name: application.name, role: "student" }).eq("id", studentId);
  }

  // Hitta eller skapa enrollment
  let enrollmentId: string | null = null;
  let isPaid = false;
  const { data: existingEnroll } = await admin
    .from("enrollments")
    .select("id, payment_status")
    .eq("student_id", studentId)
    .eq("course_id", course.id)
    .maybeSingle();

  if (existingEnroll) {
    enrollmentId = existingEnroll.id;
    isPaid = existingEnroll.payment_status === "paid";
  } else {
    const { data: newEnroll } = await admin
      .from("enrollments")
      .insert({
        student_id: studentId,
        course_id: course.id,
        payment_status: "pending",
        subscription_status: "awaiting_payment",
      })
      .select("id")
      .single();
    enrollmentId = newEnroll?.id ?? null;
  }

  // Generera ny Stripe-checkout om inte redan betald
  let checkoutUrl: string | null = null;
  if (!isPaid && enrollmentId && course.stripe_price_id) {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: course.is_subscription ? "subscription" : "payment",
      customer_email: application.email,
      line_items: [{ price: course.stripe_price_id, quantity: 1 }],
      success_url: `${siteUrl}/bekraftelse?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/kurser`,
      metadata: { enrollment_id: enrollmentId },
      allow_promotion_codes: true,
      ...(course.is_subscription
        ? { subscription_data: { metadata: { enrollment_id: enrollmentId } } }
        : {}),
    });
    checkoutUrl = session.url;
  }

  await sendApprovalEmail({
    toEmail: application.email,
    applicantName: application.name,
    courseName: course.title,
    checkoutUrl,
    passwordSetupLink,
  });

  return NextResponse.json({ ok: true, sent: true, alreadyPaid: isPaid });
}
