import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { course_id, name, email, phone, level_description } = await req.json();

  if (!course_id || !name || !email || !phone) {
    return NextResponse.json({ error: "Obligatoriska fält saknas" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Check course exists and is full
  const { data: course } = await adminClient
    .from("courses")
    .select("id, title, max_participants")
    .eq("id", course_id)
    .eq("is_active", true)
    .single();

  if (!course) {
    return NextResponse.json({ error: "Kursen hittades inte" }, { status: 404 });
  }

  // Check already in waitlist
  const { data: existing } = await adminClient
    .from("waitlist")
    .select("id")
    .eq("course_id", course_id)
    .eq("email", email)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Du är redan i kön för denna kurs" }, { status: 409 });
  }

  const { error } = await adminClient.from("waitlist").insert({
    course_id,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    level_description: level_description?.trim() ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
