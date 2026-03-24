import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, status } = body;

    if (status === "AUTHORIZED" || status === "CAPTURED") {
      const supabase = await createClient();

      await supabase
        .from("enrollments")
        .update({ payment_status: "paid", klarna_order_id: order_id })
        .eq("klarna_session_id", body.merchant_reference2);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Klarna webhook error:", err);
    return NextResponse.json({ error: "Webhook-fel" }, { status: 500 });
  }
}
