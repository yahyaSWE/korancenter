import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Ogiltig e-postadress" }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  const admin = createAdminClient();

  // Generera recovery-länk via Supabase admin (skickar inte mejl själv)
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${siteUrl}/satt-losenord`,
    },
  });

  // Säkerhet: avslöja inte om kontot finns – returnera alltid success
  if (linkErr || !linkData?.properties?.action_link) {
    return NextResponse.json({ ok: true });
  }

  await sendPasswordResetEmail({
    toEmail: email,
    resetLink: linkData.properties.action_link,
  }).catch((e) => console.error("Password reset email error:", e));

  return NextResponse.json({ ok: true });
}
