import { createAdminClient } from "@/lib/supabase/admin";
import { sendNewApplicationEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { course_id, name, email, phone, address, postal_code, city, experience } = await req.json();

  if (!course_id || !name || !email || !phone || !address || !postal_code || !city) {
    return NextResponse.json({ error: "Obligatoriska fält saknas" }, { status: 400 });
  }

  const admin = createAdminClient();
  const normalizedEmail = email.trim().toLowerCase();

  // Fetch course + teacher info
  const { data: course } = await admin
    .from("courses")
    .select("id, title, is_active, max_participants, teacher_id, teacher:profiles!teacher_id(full_name, email)")
    .eq("id", course_id)
    .single();

  if (!course || !course.is_active) {
    return NextResponse.json({ error: "Kursen hittades inte" }, { status: 404 });
  }

  // Check already applied
  const { data: existing } = await admin
    .from("applications")
    .select("id")
    .eq("course_id", course_id)
    .eq("email", normalizedEmail)
    .not("status", "eq", "rejected")
    .single();

  if (existing) {
    return NextResponse.json({ error: "Du har redan en aktiv ansökan till denna kurs" }, { status: 409 });
  }

  const { data: application, error } = await admin
    .from("applications")
    .insert({
      course_id,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      address: address.trim(),
      postal_code: postal_code.trim(),
      city: city.trim(),
      experience: experience?.trim() ?? null,
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send email to teacher if assigned
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const teacher = (course as any).teacher as { full_name: string | null; email: string | null } | null;
  if (teacher?.email) {
    await sendNewApplicationEmail({
      toEmail: teacher.email,
      toName: teacher.full_name ?? "Lärare",
      applicantName: name,
      applicantEmail: normalizedEmail,
      courseName: course.title,
      applicationId: application.id,
    }).catch(() => {}); // Don't fail if email fails
  }

  // Also notify admin (fetch admin profiles)
  const { data: admins } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("role", "admin");

  for (const a of admins ?? []) {
    if (a.email && a.email !== teacher?.email) {
      await sendNewApplicationEmail({
        toEmail: a.email,
        toName: a.full_name ?? "Admin",
        applicantName: name,
        applicantEmail: normalizedEmail,
        courseName: course.title,
        applicationId: application.id,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
