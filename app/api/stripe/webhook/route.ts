import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

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
