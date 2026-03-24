import { NextRequest, NextResponse } from "next/server";

const KLARNA_API_BASE =
  process.env.KLARNA_ENV === "production"
    ? "https://api.klarna.com"
    : "https://api.playground.klarna.com";

const KLARNA_AUTH = Buffer.from(
  `${process.env.KLARNA_USERNAME}:${process.env.KLARNA_PASSWORD}`
).toString("base64");

export async function POST(req: NextRequest) {
  try {
    const { courseId, courseTitle, priceOre, studentEmail, studentName } = await req.json();

    if (!courseId || !priceOre) {
      return NextResponse.json({ error: "Saknade parametrar" }, { status: 400 });
    }

    const body = {
      purchase_country: "SE",
      purchase_currency: "SEK",
      locale: "sv-SE",
      order_amount: priceOre,
      order_tax_amount: 0,
      order_lines: [
        {
          type: "digital",
          reference: courseId,
          name: courseTitle,
          quantity: 1,
          unit_price: priceOre,
          tax_rate: 0,
          total_amount: priceOre,
          total_tax_amount: 0,
        },
      ],
      merchant_urls: {
        confirmation: `${process.env.NEXT_PUBLIC_SITE_URL}/bekraftelse?session_id={checkout.order.id}`,
        notification: `${process.env.NEXT_PUBLIC_SITE_URL}/api/klarna/webhook`,
      },
      billing_address: {
        email: studentEmail,
        given_name: studentName?.split(" ")[0] ?? "",
        family_name: studentName?.split(" ").slice(1).join(" ") ?? "",
      },
    };

    const res = await fetch(`${KLARNA_API_BASE}/payments/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${KLARNA_AUTH}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Klarna error:", err);
      return NextResponse.json({ error: "Klarna-fel" }, { status: 500 });
    }

    const session = await res.json();

    return NextResponse.json({
      client_token: session.client_token,
      session_id: session.session_id,
    });
  } catch (err) {
    console.error("Klarna session error:", err);
    return NextResponse.json({ error: "Serverfel" }, { status: 500 });
  }
}
