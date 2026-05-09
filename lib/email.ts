import { Resend } from "resend";

const FROM = process.env.RESEND_FROM ?? "Korancenter <noreply@korancenter.se>";

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendNewApplicationEmail({
  toEmail,
  toName,
  applicantName,
  applicantEmail,
  courseName,
  applicationId,
}: {
  toEmail: string;
  toName: string;
  applicantName: string;
  applicantEmail: string;
  courseName: string;
  applicationId: string;
}) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `Ny ansökan till ${courseName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#7B3FB0">Ny ansökan mottagen</h2>
        <p>Hej ${toName},</p>
        <p><strong>${applicantName}</strong> (${applicantEmail}) har ansökt till kursen <strong>${courseName}</strong>.</p>
        <p>Logga in på din portal för att granska ansökan.</p>
        <a href="${process.env.NEXT_PUBLIC_URL ?? "https://korancenter.se"}/larare/ansokningar"
           style="display:inline-block;margin-top:12px;padding:10px 20px;background:#7B3FB0;color:white;border-radius:8px;text-decoration:none;font-weight:600">
          Granska ansökan
        </a>
        <p style="margin-top:24px;color:#999;font-size:12px">Ansöknings-ID: ${applicationId}</p>
      </div>
    `,
  });
}

export async function sendPaymentLinkEmail({
  toEmail,
  applicantName,
  courseName,
  checkoutUrl,
}: {
  toEmail: string;
  applicantName: string;
  courseName: string;
  checkoutUrl: string;
}) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `Din betalningslänk till ${courseName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#5C2D8A,#7B3FB0);padding:32px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:white;margin:0;font-size:22px">Korancenter</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0">Betalning för din kursplats</p>
        </div>
        <div style="padding:32px;background:#fff;border:1px solid #eee;border-radius:0 0 12px 12px">
          <h2 style="color:#1A1520">Assalamu alaikum, ${applicantName}!</h2>
          <p style="color:#555;line-height:1.6">
            Din ansökan till <strong>${courseName}</strong> har godkänts. Klicka på knappen nedan för att slutföra din betalning och aktivera din kursplats.
          </p>
          <div style="background:#F5EEFF;border-radius:8px;padding:16px;margin:20px 0">
            <p style="margin:0;color:#7B3FB0;font-size:13px">
              Prenumerationen faktureras var 3:e månad. Du kan när som helst avsluta via din elevportal.
            </p>
          </div>
          <div style="text-align:center;margin:28px 0">
            <a href="${checkoutUrl}"
               style="background:#7B3FB0;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px">
              Betala och aktivera kursplats
            </a>
          </div>
          <p style="color:#999;font-size:12px;text-align:center">
            Länken är giltig i 24 timmar. Kontakta oss om du har frågor.<br/>
            <strong>Korancenter</strong> · info@korancenter.se
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendApplicationStatusEmail({
  toEmail,
  applicantName,
  courseName,
  status,
  redirectCourseName,
  notes,
}: {
  toEmail: string;
  applicantName: string;
  courseName: string;
  status: "approved" | "rejected" | "redirected";
  redirectCourseName?: string;
  notes?: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const subjects: Record<string, string> = {
    approved: `Grattis! Din ansökan till ${courseName} har godkänts`,
    rejected: `Svar på din ansökan till ${courseName}`,
    redirected: `Vi rekommenderar en annan kurs för dig`,
  };

  const messages: Record<string, string> = {
    approved: `Vi är glada att meddela att din ansökan till <strong>${courseName}</strong> har <strong>godkänts</strong>! Vi kontaktar dig snart med betalningsinformation (3 månader i förväg) och uppstartsdetaljer.`,
    rejected: `Tyvärr kan vi inte ta emot din ansökan till <strong>${courseName}</strong> just nu.`,
    redirected: `Efter att ha granskat din ansökan till <strong>${courseName}</strong> rekommenderar vi att du börjar med <strong>${redirectCourseName ?? "en annan kurs"}</strong> som passar din nuvarande nivå bättre.`,
  };

  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: subjects[status],
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#7B3FB0">Svar på din ansökan</h2>
        <p>Hej ${applicantName},</p>
        <p>${messages[status]}</p>
        ${notes ? `<p style="background:#f9f9f9;padding:12px;border-radius:8px;color:#555"><em>"${notes}"</em></p>` : ""}
        <p style="margin-top:24px">Med vänliga hälsningar,<br/><strong>Korancenter</strong></p>
      </div>
    `,
  });
}
