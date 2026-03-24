import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";

export async function GET() {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { data, error: err } = await supabase!
    .from("enrollments")
    .select("*, student:profiles!student_id(id, full_name, email), course:courses(id, title)")
    .order("enrolled_at", { ascending: false });

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { student_id, course_id } = await req.json();
  if (!student_id || !course_id)
    return NextResponse.json({ error: "student_id och course_id krävs" }, { status: 400 });

  const { data, error: err } = await supabase!
    .from("enrollments")
    .insert({ student_id, course_id, payment_status: "paid" })
    .select()
    .single();

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { id } = await req.json();
  const { error: err } = await supabase!.from("enrollments").delete().eq("id", id);
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
