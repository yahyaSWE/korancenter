import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendEnrollmentActivatedEmail,
  sendEnrollmentCancelledEmail,
  sendPaymentFailedEmail,
  sendStudentEnrollmentConfirmationEmail,
} from "@/lib/email";
import { getNextScheduledLesson, type WeeklySchedule } from "@/lib/lessons";
import type Stripe from "stripe";

type NotifyArgs = {
  studentName: string;
  studentEmail: string;
  courseName: string;
  toEmails: string[];
  weeklySchedule: WeeklySchedule | null;
};

async function buildRecipients(enrollmentId: string): Promise<NotifyArgs | null> {
  try {
    const admin = createAdminClient();
    const { data: enrollment } = await admin
      .from("enrollments")
      .select("id, student:profiles!student_id(full_name, email), course:courses!course_id(title, teacher_id, weekly_schedule)")
      .eq("id", enrollmentId)
      .single();
    if (!enrollment) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const student = (enrollment as any).student as { full_name: string | null; email: string | null } | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const course = (enrollment as any).course as {
      title: string;
      teacher_id: string | null;
      weekly_schedule: WeeklySchedule | null;
    } | null;
    if (!student || !course) return null;

    const recipients = new Set<string>();
    if (course.teacher_id) {
      const { data: teacher } = await admin.from("profiles").select("email").eq("id", course.teacher_id).single();
      if (teacher?.email) recipients.add(teacher.email);
    }
    const { data: admins } = await admin.from("profiles").select("email").eq("role", "admin");
    for (const a of admins ?? []) {
      if (a.email) recipients.add(a.email);
    }

    return {
      toEmails: Array.from(recipients),
      studentName: student.full_name ?? student.email ?? "Okänd elev",
      studentEmail: student.email ?? "",
      courseName: course.title,
      weeklySchedule: course.weekly_schedule,
    };
  } catch (e) {
    console.error("[stripe-webhook] buildRecipients error:", e);
    return null;
  }
}

async function notifyEnrollmentActivated(
  enrollmentId: string,
  { notifyStaff, notifyStudent }: { notifyStaff: boolean; notifyStudent: boolean },
) {
  const args = await buildRecipients(enrollmentId);
  if (!args) throw new Error("Kunde inte läsa elev- och kursuppgifter för bekräftelsemejlet");

  if (notifyStaff) {
    await sendEnrollmentActivatedEmail(args).catch((e) =>
      console.error("[stripe-webhook] activated staff email error:", e),
    );
  }

  if (!notifyStudent) return;
  if (!args.studentEmail) throw new Error("Eleven saknar e-postadress för inskrivningsbekräftelsen");

  await sendStudentEnrollmentConfirmationEmail({
    toEmail: args.studentEmail,
    studentName: args.studentName,
    courseName: args.courseName,
    nextLesson: getNextScheduledLesson(args.weeklySchedule),
  });

  const admin = createAdminClient();
  const { error } = await admin
    .from("enrollments")
    .update({ student_confirmation_sent_at: new Date().toISOString() })
    .eq("id", enrollmentId);
  if (error) throw new Error(`Kunde inte registrera inskrivningsbekräftelsen: ${error.message}`);
}

async function notifyCancellation(enrollmentId: string, endsAt: string | null) {
  const args = await buildRecipients(enrollmentId);
  if (!args) return;
  await sendEnrollmentCancelledEmail({ ...args, endsAt }).catch((e) =>
    console.error("[stripe-webhook] cancelled email error:", e),
  );
}

async function notifyPaymentFailed(enrollmentId: string) {
  const args = await buildRecipients(enrollmentId);
  if (!args) return;
  await sendPaymentFailedEmail(args).catch((e) =>
    console.error("[stripe-webhook] failed email error:", e),
  );
}

async function findEnrollmentIdBySubscription(subscriptionId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("enrollments")
    .select("id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();
  if (error) throw new Error(`Kunde inte hitta kursplats för prenumeration: ${error.message}`);
  return data?.id ?? null;
}

function periodEnd(sub: Stripe.Subscription): string {
  // SDK v17+: current_period_end lives on the SubscriptionItem, not the Subscription
  const end = sub.items?.data?.[0]?.current_period_end;
  return new Date((end ?? 0) * 1000).toISOString();
}

async function activateCheckoutSession(session: Stripe.Checkout.Session) {
  const enrollmentId = session.metadata?.enrollment_id;
  if (!enrollmentId) throw new Error("Stripe-sessionen saknar enrollment_id");

  // För fördröjda betalningsmetoder inväntar vi async_payment_succeeded.
  if (session.payment_status === "unpaid") return;

  const admin = createAdminClient();
  const { data: prior, error: priorError } = await admin
    .from("enrollments")
    .select("payment_status, student_confirmation_sent_at")
    .eq("id", enrollmentId)
    .single();
  if (priorError || !prior) {
    throw new Error(`Kunde inte hitta kursplatsen: ${priorError?.message ?? enrollmentId}`);
  }
  const wasAlreadyPaid = prior.payment_status === "paid";
  const needsStudentConfirmation = !prior.student_confirmation_sent_at;

  if (session.mode === "subscription") {
    if (!session.subscription) throw new Error("Stripe-sessionen saknar subscription-id");
    const sub = await getStripe().subscriptions.retrieve(session.subscription as string);
    const { error: updateError } = await admin.from("enrollments").update({
      payment_status: "paid",
      stripe_subscription_id: sub.id,
      stripe_customer_id: session.customer as string,
      current_period_end: periodEnd(sub),
      subscription_status: "active",
    }).eq("id", enrollmentId);
    if (updateError) throw new Error(`Kunde inte aktivera kursplatsen: ${updateError.message}`);
  } else if (session.mode === "payment") {
    const { error: updateError } = await admin.from("enrollments").update({
      payment_status: "paid",
      stripe_customer_id: session.customer as string,
    }).eq("id", enrollmentId);
    if (updateError) throw new Error(`Kunde inte aktivera kursplatsen: ${updateError.message}`);
  } else {
    throw new Error(`Okänt checkout-läge: ${session.mode}`);
  }

  if (!wasAlreadyPaid || needsStudentConfirmation) {
    await notifyEnrollmentActivated(enrollmentId, {
      notifyStaff: !wasAlreadyPaid,
      notifyStudent: needsStudentConfirmation,
    });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    console.error("[stripe-webhook] saknar stripe-signature-header");
    return NextResponse.json({ error: "Saknar signatur" }, { status: 400 });
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET saknas i miljövariabler");
    return NextResponse.json({ error: "Webhook-hemlighet ej konfigurerad" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe-webhook] signaturverifiering misslyckades:", msg);
    return NextResponse.json({ error: "Ogiltig signatur: " + msg }, { status: 400 });
  }

  try {
    switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await activateCheckoutSession(session);
      break;
    }

    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      await activateCheckoutSession(session);
      break;
    }

    case "invoice.payment_succeeded": {
      const admin = createAdminClient();
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
      if (!invoice.subscription) break;
      const sub = await getStripe().subscriptions.retrieve(invoice.subscription);
      const { error: updateError } = await admin.from("enrollments").update({
        payment_status: "paid",
        current_period_end: periodEnd(sub),
        subscription_status: sub.cancel_at_period_end ? "cancel_at_period_end" : "active",
      }).eq("stripe_subscription_id", invoice.subscription);
      if (updateError) throw new Error(`Kunde inte registrera betalningen: ${updateError.message}`);
      break;
    }

    case "invoice.payment_failed": {
      const admin = createAdminClient();
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
      if (!invoice.subscription) break;
      const { error: updateError } = await admin.from("enrollments").update({
        subscription_status: "past_due",
      }).eq("stripe_subscription_id", invoice.subscription);
      if (updateError) throw new Error(`Kunde inte registrera misslyckad betalning: ${updateError.message}`);

      const enrollmentId = await findEnrollmentIdBySubscription(invoice.subscription);
      if (enrollmentId) await notifyPaymentFailed(enrollmentId);
      break;
    }

    case "customer.subscription.updated": {
      const admin = createAdminClient();
      const sub = event.data.object as Stripe.Subscription;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prev = (event.data as any).previous_attributes as { cancel_at_period_end?: boolean } | undefined;
      const { error: updateError } = await admin.from("enrollments").update({
        subscription_status: sub.cancel_at_period_end ? "cancel_at_period_end" : sub.status,
        current_period_end: periodEnd(sub),
      }).eq("stripe_subscription_id", sub.id);
      if (updateError) throw new Error(`Kunde inte uppdatera prenumerationen: ${updateError.message}`);

      // Notifiera bara om eleven precis sa upp (gick från false → true)
      if (sub.cancel_at_period_end === true && prev?.cancel_at_period_end === false) {
        const enrollmentId = await findEnrollmentIdBySubscription(sub.id);
        if (enrollmentId) await notifyCancellation(enrollmentId, periodEnd(sub));
      }
      break;
    }

    case "customer.subscription.deleted": {
      const admin = createAdminClient();
      const sub = event.data.object as Stripe.Subscription;
      const enrollmentId = await findEnrollmentIdBySubscription(sub.id);
      const { error: updateError } = await admin.from("enrollments").update({
        payment_status: "cancelled",
        subscription_status: "canceled",
      }).eq("stripe_subscription_id", sub.id);
      if (updateError) throw new Error(`Kunde inte avsluta kursplatsen: ${updateError.message}`);

      // Notifiera om det INTE redan notifierades via cancel_at_period_end
      // (om eleven sa upp tidigare har de redan fått besked)
      if (enrollmentId && !sub.cancel_at_period_end) {
        await notifyCancellation(enrollmentId, null);
      }
      break;
    }
    }
  } catch (err) {
    console.error(`[stripe-webhook] fel vid hantering av ${event.type}:`, err);
    return NextResponse.json({ error: "Internt fel vid bearbetning" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
