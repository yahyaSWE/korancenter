import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";

export async function GET(req: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const courseId = new URL(req.url).searchParams.get("course_id");

  let query = supabase!
    .from("lessons")
    .select("*, course:courses(title)")
    .order("scheduled_at", { ascending: true });

  if (courseId) query = query.eq("course_id", courseId);

  const { data, error: err } = await query;
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { data, error: err } = await supabase!
    .from("lessons")
    .insert({
      course_id: body.course_id,
      title: body.title,
      description: body.description ?? null,
      scheduled_at: body.scheduled_at ?? null,
      duration_minutes: Number(body.duration_minutes) || 60,
      meeting_link: body.meeting_link ?? null,
      is_cancelled: false,
    })
    .select()
    .single();

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { id, ...rest } = body;

  const { data, error: err } = await supabase!
    .from("lessons")
    .update({
      title: rest.title,
      description: rest.description ?? null,
      scheduled_at: rest.scheduled_at ?? null,
      duration_minutes: Number(rest.duration_minutes) || 60,
      meeting_link: rest.meeting_link ?? null,
      is_cancelled: rest.is_cancelled ?? false,
    })
    .eq("id", id)
    .select()
    .single();

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { id } = await req.json();
  const { error: err } = await supabase!.from("lessons").delete().eq("id", id);
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
