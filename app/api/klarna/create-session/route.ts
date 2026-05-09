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
    const body = await req.json();
    const { courseId, courseTitle, priceOre, studentEmail, studentName } = body;

    // Validera obligatoriska fält
    if (!courseId || typeof courseId !== "string" || courseId.trim() === "") {
      return NextResponse.json({ error: "Ogiltigt kurs-ID" }, { status: 400 });
    }
    if (!priceOre || typeof priceOre !== "number" || !Number.isInteger(priceOre) || priceOre <= 0) {
      return NextResponse.json({ error: "Ogiltigt pris" }, { status: 400 });
    }
    if (priceOre > 100_000_00) {
      return NextResponse.json({ error: "Priset överstiger maxgränsen" }, { status: 400 });
    }
    if (studentEmail && (typeof studentEmail !== "string" || !studentEmail.includes("@"))) {
      return NextResponse.json({ error: "Ogiltig e-postadress" }, { status: 400 });
    }
    if (!process.env.KLARNA_USERNAME || !process.env.KLARNA_PASSWORD) {
      console.error("Klarna-uppgifter saknas i miljövariabler");
      return NextResponse.json({ error: "Betalning ej konfigurerad" }, { status: 503 });
    }
    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      console.error("NEXT_PUBLIC_SITE_URL saknas i miljövariabler");
      return NextResponse.json({ error: "Serverfel: webbplatsens URL är ej konfigurerad" }, { status: 503 });
    }

    const klarnaBody = {
      purchase_country: "SE",
      purchase_currency: "SEK",
      locale: "sv-SE",
      order_amount: priceOre,
      order_tax_amount: 0,
      order_lines: [
        {
          type: "digital",
          reference: courseId.slice(0, 64),
          name: (courseTitle ?? "Korankurs").slice(0, 255),
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
        email: studentEmail ?? "",
        given_name: (studentName ?? "").split(" ")[0] ?? "",
        family_name: (studentName ?? "").split(" ").slice(1).join(" ") ?? "",
      },
    };

    const res = await fetch(`${KLARNA_API_BASE}/payments/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${KLARNA_AUTH}`,
      },
      body: JSON.stringify(klarnaBody),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Klarna error:", err);
      return NextResponse.json({ error: "Betalningsfel – försök igen" }, { status: 502 });
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
