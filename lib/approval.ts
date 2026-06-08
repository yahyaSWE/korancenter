import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { sendApprovalEmail, sendApplicationStatusEmail } from "@/lib/email";

type ApplicationWithCourse = {
  id: string;
  name: string;
  email: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  course?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  redirect_course?: any;
};

type RunApprovalArgs = {
  application: ApplicationWithCourse;
  status: "approved" | "rejected" | "redirected";
  reviewerId: string;
  redirectCourseId?: string | null;
  adminNotes?: string | null;
};

/**
 * Kör det fullständiga godkännande-flödet (eller skickar status-mejl vid neka/hänvisa).
 * Vid "approved": skapar Supabase-konto (om saknas), enrollment och Stripe-checkout,
 * och skickar välkomstmejl med både betalningslänk och lösenordslänk.
 */
export async function runApprovalFlow({
  application,
  status,
  reviewerId,
  redirectCourseId,
  adminNotes,
}: RunApprovalArgs): Promise<{ ok: true } | { error: string }> {
  const admin = createAdminClient();

  // Uppdatera ansökans status
  const { error: updateErr } = await admin
    .from("applications")
    .update({
      status,
      redirect_course_id: status === "redirected" ? redirectCourseId : null,
      admin_notes: adminNotes ?? null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
    })
    .eq("id", application.id);

  if (updateErr) return { error: updateErr.message };

  const course = application.course as { id: string; title: string; stripe_price_id: string | null; is_subscription: boolean } | null;

  // Slå upp namnet på hänvisningskursen FÄRSKT (den joinade redirect_course
  // är stale eftersom redirect_course_id precis sattes i denna request)
  let redirectName: string | undefined =
    (application.redirect_course as { title?: string } | null)?.title;
  if (status === "redirected" && redirectCourseId) {
    const { data: rc } = await admin
      .from("courses")
      .select("title")
      .eq("id", redirectCourseId)
      .maybeSingle();
    redirectName = rc?.title ?? redirectName;
  }

  // Godkännande: skapa konto + enrollment + Stripe checkout + nytt välkomstmejl
  if (status === "approved" && course?.id) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    let studentId: string | null = null;
    let passwordSetupLink: string | null = null;

    try {
      const { data: existing } = await admin
        .from("profiles")
        .select("id")
        .eq("email", application.email)
        .maybeSingle();

      if (existing) {
        studentId = existing.id;
      } else {
        const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
          type: "invite",
          email: application.email,
          options: {
            data: { full_name: application.name },
            redirectTo: `${siteUrl}/satt-losenord`,
          },
        });

        if (!linkErr && linkData?.user) {
          studentId = linkData.user.id;
          passwordSetupLink = linkData.properties?.action_link ?? null;
          await admin.from("profiles").update({
            full_name: application.name,
            role: "student",
          }).eq("id", studentId);
        }
      }

      if (studentId) {
        // Skapa enrollment om det inte redan finns
        const { data: existingEnroll } = await admin
          .from("enrollments")
          .select("id")
          .eq("student_id", studentId)
          .eq("course_id", course.id)
          .maybeSingle();

        let enrollmentId = existingEnroll?.id ?? null;
        if (!enrollmentId) {
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

        // Stripe checkout
        let checkoutUrl: string | null = null;
        if (enrollmentId && course.stripe_price_id) {
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

        return { ok: true };
      }
    } catch (e) {
      console.error("[runApprovalFlow]", e);
      // Faller vidare till standardmail nedan
    }
  }

  // Standardmail (nekad/hänvisad/fallback)
  await sendApplicationStatusEmail({
    toEmail: application.email,
    applicantName: application.name,
    courseName: course?.title ?? "",
    status,
    redirectCourseName: redirectName,
    notes: adminNotes ?? undefined,
  }).catch(() => {});

  return { ok: true };
}
