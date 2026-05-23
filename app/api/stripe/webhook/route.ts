import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEnrollmentActivatedEmail } from "@/lib/email";
import type Stripe from "stripe";

async function notifyTeacherAndAdmin(enrollmentId: string) {
  try {
    const admin = createAdminClient();
    // Hämta enrollment + student + kurs + lärare
    const { data: enrollment } = await admin
      .from("enrollments")
      .select("id, student:profiles!student_id(full_name, email), course:courses!course_id(title, teacher_id)")
      .eq("id", enrollmentId)
      .single();

    if (!enrollment) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const student = (enrollment as any).student as { full_name: string | null; email: string | null } | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const course = (enrollment as any).course as { title: string; teacher_id: string | null } | null;
    if (!student || !course) return;

    // Hämta lärarens e-post + alla admins
    const recipients = new Set<string>();
    if (course.teacher_id) {
      const { data: teacher } = await admin.from("profiles").select("email").eq("id", course.teacher_id).single();
      if (teacher?.email) recipients.add(teacher.email);
    }
    const { data: admins } = await admin.from("profiles").select("email").eq("role", "admin");
    for (const a of admins ?? []) {
      if (a.email) recipients.add(a.email);
    }

    if (recipients.size === 0) return;

    await sendEnrollmentActivatedEmail({
      toEmails: Array.from(recipients),
      studentName: student.full_name ?? student.email ?? "Okänd elev",
      studentEmail: student.email ?? "",
      courseName: course.title,
    });
  } catch (e) {
    console.error("[stripe-webhook] notifyTeacherAndAdmin error:", e);
  }
}

function periodEnd(sub: Stripe.Subscription): string {
  // SDK v17+: current_period_end lives on the SubscriptionItem, not the Subscription
  const end = sub.items?.data?.[0]?.current_period_end;
  return new Date((end ?? 0) * 1000).toISOString();
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
    const admin = createAdminClient();

    switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const enrollmentId = session.metadata?.enrollment_id;
      if (!enrollmentId) break;

      // Kolla om enrollmentet redan var betalt – då skippar vi notifikationen
      const { data: prior } = await admin
        .from("enrollments")
        .select("payment_status")
        .eq("id", enrollmentId)
        .single();
      const wasAlreadyPaid = prior?.payment_status === "paid";

      if (session.mode === "subscription" && session.subscription) {
        const sub = await getStripe().subscriptions.retrieve(session.subscription as string);
        await admin.from("enrollments").update({
          payment_status: "paid",
          stripe_subscription_id: sub.id,
          stripe_customer_id: session.customer as string,
          current_period_end: periodEnd(sub),
          subscription_status: "active",
        }).eq("id", enrollmentId);
      } else if (session.mode === "payment") {
        await admin.from("enrollments").update({
          payment_status: "paid",
          stripe_customer_id: session.customer as string,
        }).eq("id", enrollmentId);
      }

      // Skicka notis till lärare + admin endast vid första aktiveringen
      if (!wasAlreadyPaid) {
        await notifyTeacherAndAdmin(enrollmentId);
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
      if (!invoice.subscription) break;
      const sub = await getStripe().subscriptions.retrieve(invoice.subscription);
      await admin.from("enrollments").update({
        payment_status: "paid",
        current_period_end: periodEnd(sub),
        subscription_status: sub.cancel_at_period_end ? "cancel_at_period_end" : "active",
      }).eq("stripe_subscription_id", invoice.subscription);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
      if (!invoice.subscription) break;
      await admin.from("enrollments").update({
        subscription_status: "past_due",
      }).eq("stripe_subscription_id", invoice.subscription);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      await admin.from("enrollments").update({
        subscription_status: sub.cancel_at_period_end ? "cancel_at_period_end" : sub.status,
        current_period_end: periodEnd(sub),
      }).eq("stripe_subscription_id", sub.id);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await admin.from("enrollments").update({
        payment_status: "cancelled",
        subscription_status: "canceled",
      }).eq("stripe_subscription_id", sub.id);
      break;
    }
    }
  } catch (err) {
    console.error(`[stripe-webhook] fel vid hantering av ${event.type}:`, err);
    return NextResponse.json({ error: "Internt fel vid bearbetning" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
