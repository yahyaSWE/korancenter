import { createAdminClient } from "@/lib/supabase/admin";
import { sendNewApplicationEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { course_id, name, email, phone, level_description } = await req.json();

  if (!course_id || !name || !email || !phone) {
    return NextResponse.json({ error: "Obligatoriska fält saknas" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const normalizedEmail = email.trim().toLowerCase();

  // Bakåtkompatibilitet för äldre öppna klienter: även den gamla
  // kö-endpointen skapar nu en väntande läraransökan.
  const { data: course } = await adminClient
    .from("courses")
    .select("id, title, max_participants, teacher_id, teacher:profiles!teacher_id(full_name, email)")
    .eq("id", course_id)
    .eq("is_active", true)
    .single();

  if (!course) {
    return NextResponse.json({ error: "Kursen hittades inte" }, { status: 404 });
  }

  // Samma person ska inte kunna skapa flera aktiva ansökningar till kursen.
  const { data: existing } = await adminClient
    .from("applications")
    .select("id")
    .eq("course_id", course_id)
    .eq("email", normalizedEmail)
    .not("status", "eq", "rejected")
    .single();

  if (existing) {
    return NextResponse.json({ error: "Du har redan en aktiv ansökan till denna kurs" }, { status: 409 });
  }

  const { data: application, error } = await adminClient
    .from("applications")
    .insert({
      course_id,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      address: "",
      postal_code: "",
      city: "",
      experience: level_description?.trim() ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teacher = (course as any).teacher as { full_name: string | null; email: string | null } | null;
  if (teacher?.email) {
    await sendNewApplicationEmail({
      toEmail: teacher.email,
      toName: teacher.full_name ?? "Lärare",
      applicantName: name.trim(),
      applicantEmail: normalizedEmail,
      courseName: course.title,
      applicationId: application.id,
    }).catch(() => {});
  }

  const { data: admins } = await adminClient
    .from("profiles")
    .select("full_name, email")
    .eq("role", "admin");

  for (const admin of admins ?? []) {
    if (admin.email && admin.email !== teacher?.email) {
      await sendNewApplicationEmail({
        toEmail: admin.email,
        toName: admin.full_name ?? "Admin",
        applicantName: name.trim(),
        applicantEmail: normalizedEmail,
        courseName: course.title,
        applicationId: application.id,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true, application_id: application.id });
}
