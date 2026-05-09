import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendApplicationStatusEmail, sendPaymentLinkEmail } from "@/lib/email";
import { getStripe } from "@/lib/stripe";
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
    .select("*, course:courses!course_id(id, title, stripe_price_id, is_subscription), redirect_course:courses!redirect_course_id(id, title)")
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const course = (application as any).course as { id: string; title: string; stripe_price_id: string | null; is_subscription: boolean } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const redirectName = (application as any).redirect_course?.title;

  // Vid godkännande: försök skapa enrollment + Stripe checkout
  if (status === "approved" && course?.id) {
    try {
      // Hitta elev med samma e-post
      const { data: profile } = await admin
        .from("profiles")
        .select("id")
        .eq("email", application.email)
        .maybeSingle();

      if (profile) {
        // Skapa enrollment (pending)
        const { data: enrollment } = await admin
          .from("enrollments")
          .insert({
            student_id: profile.id,
            course_id: course.id,
            payment_status: "pending",
            subscription_status: "awaiting_payment",
          })
          .select("id")
          .single();

        // Skicka betalningslänk om kursen har stripe_price_id
        if (enrollment && course.stripe_price_id) {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
          const stripe = getStripe();
          const session = await stripe.checkout.sessions.create({
            mode: course.is_subscription ? "subscription" : "payment",
            customer_email: application.email,
            line_items: [{ price: course.stripe_price_id, quantity: 1 }],
            success_url: `${siteUrl}/bekraftelse?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${siteUrl}/kurser`,
            metadata: { enrollment_id: enrollment.id },
            ...(course.is_subscription
              ? { subscription_data: { metadata: { enrollment_id: enrollment.id } } }
              : {}),
          });

          if (session.url) {
            await sendPaymentLinkEmail({
              toEmail: application.email,
              applicantName: application.name,
              courseName: course.title,
              checkoutUrl: session.url,
            });
            return NextResponse.json({ ok: true });
          }
        }
      }
    } catch (e) {
      console.error("Stripe/enrollment error vid godkännande:", e);
      // Faller igenom till vanligt godkännandemail nedan
    }
  }

  // Standardmail (godkänd utan Stripe, nekad, eller hänvisad)
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
