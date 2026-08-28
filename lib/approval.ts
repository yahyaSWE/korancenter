import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import {
  sendApprovalEmail,
  sendApplicationStatusEmail,
  sendNewApplicationEmail,
} from "@/lib/email";
import type { ApplicationPaymentStatus } from "@/lib/application-payment";

type CourseSummary = {
  id: string;
  title: string;
  teacher_id?: string | null;
  stripe_price_id: string | null;
  is_subscription: boolean;
  is_active?: boolean;
};

export type ApplicationWithCourse = {
  id: string;
  course_id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  experience?: string | null;
  course?: CourseSummary | null;
};

type RunApprovalArgs = {
  application: ApplicationWithCourse;
  status: "approved" | "rejected" | "redirected";
  reviewerId: string;
  redirectCourseId?: string | null;
  adminNotes?: string | null;
};

export type ApprovalSuccess = {
  ok: true;
  payment_status?: ApplicationPaymentStatus;
  transferred_application_id?: string;
};

export type ApprovalDependencies = {
  createAdminClient: typeof createAdminClient;
  getStripe: typeof getStripe;
  sendApprovalEmail: typeof sendApprovalEmail;
  sendApplicationStatusEmail: typeof sendApplicationStatusEmail;
  sendNewApplicationEmail: typeof sendNewApplicationEmail;
  now: () => string;
  siteUrl: () => string;
};

const defaultDependencies: ApprovalDependencies = {
  createAdminClient,
  getStripe,
  sendApprovalEmail,
  sendApplicationStatusEmail,
  sendNewApplicationEmail,
  now: () => new Date().toISOString(),
  siteUrl: () => {
    const value = process.env.NEXT_PUBLIC_SITE_URL;
    if (value) return value.replace(/\/$/, "");
    if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
    throw new Error("NEXT_PUBLIC_SITE_URL saknas");
  },
};

class ApprovalFlowError extends Error {}

function assertNoError(error: { message: string } | null, context: string) {
  if (error) throw new ApprovalFlowError(`${context}: ${error.message}`);
}

async function updateApplicationStatus(
  admin: ReturnType<typeof createAdminClient>,
  applicationId: string,
  status: RunApprovalArgs["status"],
  reviewerId: string,
  redirectCourseId: string | null,
  adminNotes: string | null,
  now: string,
) {
  const { error } = await admin
    .from("applications")
    .update({
      status,
      redirect_course_id: status === "redirected" ? redirectCourseId : null,
      admin_notes: adminNotes,
      reviewed_at: now,
      reviewed_by: reviewerId,
    })
    .eq("id", applicationId);
  assertNoError(error, "Kunde inte uppdatera ansökan");
}

/** Skapar eller återställer elevens kursplats och skickar en ny betalningslänk. */
export async function sendApprovalInstructions(
  application: ApplicationWithCourse,
  dependencies: ApprovalDependencies = defaultDependencies,
): Promise<{ payment_status: ApplicationPaymentStatus }> {
  const admin = dependencies.createAdminClient();
  const course = application.course;
  if (!course?.id) throw new ApprovalFlowError("Kursen saknas på ansökan");
  if (course.is_active === false) throw new ApprovalFlowError("Kursen är inte aktiv");

  const siteUrl = dependencies.siteUrl();
  const normalizedEmail = application.email.trim().toLowerCase();
  const { data: existingProfile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();
  assertNoError(profileError, "Kunde inte kontrollera elevkontot");

  let studentId: string;
  let passwordSetupLink: string | null = null;
  if (existingProfile) {
    studentId = existingProfile.id;
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: normalizedEmail,
      options: { redirectTo: `${siteUrl}/satt-losenord` },
    });
    assertNoError(linkError, "Kunde inte skapa lösenordslänk");
    passwordSetupLink = linkData?.properties?.action_link ?? null;
  } else {
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "invite",
      email: normalizedEmail,
      options: {
        data: { full_name: application.name },
        redirectTo: `${siteUrl}/satt-losenord`,
      },
    });
    assertNoError(linkError, "Kunde inte skapa elevkonto");
    if (!linkData?.user) throw new ApprovalFlowError("Kunde inte skapa elevkonto");
    studentId = linkData.user.id;
    passwordSetupLink = linkData.properties?.action_link ?? null;

    const { error: profileUpdateError } = await admin
      .from("profiles")
      .update({ full_name: application.name, role: "student" })
      .eq("id", studentId);
    assertNoError(profileUpdateError, "Kunde inte uppdatera elevprofilen");
  }
  if (!passwordSetupLink) throw new ApprovalFlowError("Kunde inte skapa en giltig lösenordslänk");

  const { data: existingEnrollment, error: enrollmentLookupError } = await admin
    .from("enrollments")
    .select("id, payment_status")
    .eq("student_id", studentId)
    .eq("course_id", course.id)
    .maybeSingle();
  assertNoError(enrollmentLookupError, "Kunde inte kontrollera kursplatsen");

  let enrollmentId: string;
  let paymentStatus = (existingEnrollment?.payment_status ?? "pending") as ApplicationPaymentStatus;
  if (existingEnrollment) {
    enrollmentId = existingEnrollment.id;
    if (paymentStatus !== "paid") {
      const { error: resetError } = await admin
        .from("enrollments")
        .update({
          payment_status: "pending",
          subscription_status: "awaiting_payment",
          stripe_subscription_id: null,
          stripe_customer_id: null,
          current_period_end: null,
        })
        .eq("id", enrollmentId);
      assertNoError(resetError, "Kunde inte återställa kursplatsen för betalning");
      paymentStatus = "pending";
    }
  } else {
    const { data: newEnrollment, error: insertError } = await admin
      .from("enrollments")
      .insert({
        student_id: studentId,
        course_id: course.id,
        payment_status: "pending",
        subscription_status: "awaiting_payment",
      })
      .select("id")
      .single();
    assertNoError(insertError, "Kunde inte skapa kursplatsen");
    if (!newEnrollment?.id) throw new ApprovalFlowError("Kunde inte skapa kursplatsen");
    enrollmentId = newEnrollment.id;
    paymentStatus = "pending";
  }

  let checkoutUrl: string | null = null;
  if (paymentStatus !== "paid") {
    if (!course.stripe_price_id) {
      throw new ApprovalFlowError(`Kursen "${course.title}" saknar Stripe Pris-ID`);
    }
    const session = await dependencies.getStripe().checkout.sessions.create({
      mode: course.is_subscription ? "subscription" : "payment",
      customer_email: normalizedEmail,
      line_items: [{ price: course.stripe_price_id, quantity: 1 }],
      success_url: `${siteUrl}/bekraftelse?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/kurser`,
      metadata: { enrollment_id: enrollmentId },
      allow_promotion_codes: true,
      ...(course.is_subscription
        ? { subscription_data: { metadata: { enrollment_id: enrollmentId } } }
        : {}),
    });
    if (!session.url) throw new ApprovalFlowError("Stripe skapade ingen betalningslänk");
    checkoutUrl = session.url;
  }

  await dependencies.sendApprovalEmail({
    toEmail: normalizedEmail,
    applicantName: application.name,
    courseName: course.title,
    checkoutUrl,
    passwordSetupLink,
  });
  return { payment_status: paymentStatus };
}

async function transferApplication(
  args: RunApprovalArgs,
  dependencies: ApprovalDependencies,
): Promise<ApprovalSuccess> {
  if (!args.redirectCourseId) throw new ApprovalFlowError("Välj en kurs att hänvisa eleven till");
  if (args.redirectCourseId === args.application.course_id) {
    throw new ApprovalFlowError("Det går inte att hänvisa till samma kurs");
  }

  const admin = dependencies.createAdminClient();
  const { data: redirectCourse, error: courseError } = await admin
    .from("courses")
    .select("id, title, is_active, teacher_id, teacher:profiles!teacher_id(full_name, email)")
    .eq("id", args.redirectCourseId)
    .maybeSingle();
  assertNoError(courseError, "Kunde inte läsa hänvisningskursen");
  if (!redirectCourse?.is_active) throw new ApprovalFlowError("Hänvisningskursen är inte aktiv");

  const normalizedEmail = args.application.email.trim().toLowerCase();
  const { data: existingApplication, error: existingError } = await admin
    .from("applications")
    .select("id, status")
    .eq("course_id", redirectCourse.id)
    .eq("email", normalizedEmail)
    .neq("status", "rejected")
    .limit(1)
    .maybeSingle();
  assertNoError(existingError, "Kunde inte kontrollera tidigare hänvisning");

  let transferredApplicationId = existingApplication?.id ?? null;
  if (!transferredApplicationId) {
    const { data: transferred, error: insertError } = await admin
      .from("applications")
      .insert({
        course_id: redirectCourse.id,
        name: args.application.name,
        email: normalizedEmail,
        phone: args.application.phone ?? "",
        address: args.application.address ?? "",
        postal_code: args.application.postal_code ?? "",
        city: args.application.city ?? "",
        experience: args.application.experience ?? null,
        status: "pending",
      })
      .select("id")
      .single();
    assertNoError(insertError, "Kunde inte flytta ansökan till den nya kursen");
    if (!transferred?.id) throw new ApprovalFlowError("Kunde inte flytta ansökan till den nya kursen");
    transferredApplicationId = transferred.id;
  }

  await dependencies.sendApplicationStatusEmail({
    toEmail: normalizedEmail,
    applicantName: args.application.name,
    courseName: args.application.course?.title ?? "",
    status: "redirected",
    redirectCourseName: redirectCourse.title,
    notes: args.adminNotes ?? undefined,
  });
  await updateApplicationStatus(
    admin,
    args.application.id,
    "redirected",
    args.reviewerId,
    redirectCourse.id,
    args.adminNotes ?? null,
    dependencies.now(),
  );

  if (!existingApplication) {
    const recipients = new Map<string, string>();
    const teacher = redirectCourse.teacher as unknown as { full_name: string | null; email: string | null } | null;
    if (teacher?.email) recipients.set(teacher.email, teacher.full_name ?? "Lärare");

    const { data: admins, error: adminsError } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("role", "admin");
    if (adminsError) {
      console.error("[approval] kunde inte läsa administratörer", adminsError);
    } else {
      for (const profile of admins ?? []) {
        if (profile.email) recipients.set(profile.email, profile.full_name ?? "Admin");
      }
    }

    for (const [toEmail, toName] of recipients) {
      await dependencies.sendNewApplicationEmail({
        toEmail,
        toName,
        applicantName: args.application.name,
        applicantEmail: normalizedEmail,
        courseName: redirectCourse.title,
        applicationId: transferredApplicationId,
      }).catch((error) => console.error("[approval] kunde inte notifiera om hänvisning", error));
    }
  }

  return { ok: true, transferred_application_id: transferredApplicationId };
}

/** Kör hela beslutet och sparar slutstatus först när de nödvändiga stegen lyckats. */
export async function runApprovalFlow(
  args: RunApprovalArgs,
  dependencies: ApprovalDependencies = defaultDependencies,
): Promise<ApprovalSuccess | { error: string }> {
  try {
    if (args.status === "approved") {
      const approval = await sendApprovalInstructions(args.application, dependencies);
      await updateApplicationStatus(
        dependencies.createAdminClient(),
        args.application.id,
        "approved",
        args.reviewerId,
        null,
        args.adminNotes ?? null,
        dependencies.now(),
      );
      return { ok: true, payment_status: approval.payment_status };
    }

    if (args.status === "redirected") return await transferApplication(args, dependencies);

    await dependencies.sendApplicationStatusEmail({
      toEmail: args.application.email.trim().toLowerCase(),
      applicantName: args.application.name,
      courseName: args.application.course?.title ?? "",
      status: "rejected",
      notes: args.adminNotes ?? undefined,
    });
    await updateApplicationStatus(
      dependencies.createAdminClient(),
      args.application.id,
      "rejected",
      args.reviewerId,
      null,
      args.adminNotes ?? null,
      dependencies.now(),
    );
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Okänt fel";
    console.error("[runApprovalFlow]", error);
    return { error: message };
  }
}
