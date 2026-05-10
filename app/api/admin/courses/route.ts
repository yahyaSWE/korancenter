import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";

export async function GET() {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { data, error: err } = await supabase!
    .from("courses")
    .select("*, teacher:profiles!teacher_id(id, full_name, email)")
    .order("created_at", { ascending: false });

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { data, error: err } = await supabase!
    .from("courses")
    .insert({
      title: body.title,
      description: body.description ?? null,
      level: body.level ?? null,
      price_sek: Number(body.price_sek),
      sessions_per_week: Number(body.sessions_per_week) || 2,
      duration_weeks: body.duration_weeks ? Number(body.duration_weeks) : null,
      teacher_id: body.teacher_id || null,
      max_participants: body.max_participants ? Number(body.max_participants) : null,
      is_active: true,
      is_subscription: body.is_subscription !== false,
      stripe_price_id: body.stripe_price_id?.trim() || null,
      meeting_link: body.meeting_link?.trim() || null,
      weekly_schedule: Array.isArray(body.weekly_schedule) ? body.weekly_schedule : null,
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
    .from("courses")
    .update({
      title: rest.title,
      description: rest.description ?? null,
      level: rest.level ?? null,
      price_sek: Number(rest.price_sek),
      sessions_per_week: Number(rest.sessions_per_week) || 2,
      duration_weeks: rest.duration_weeks ? Number(rest.duration_weeks) : null,
      teacher_id: rest.teacher_id || null,
      max_participants: rest.max_participants ? Number(rest.max_participants) : null,
      is_active: rest.is_active ?? true,
      is_subscription: rest.is_subscription !== false,
      stripe_price_id: rest.stripe_price_id?.trim() || null,
      meeting_link: rest.meeting_link?.trim() || null,
      weekly_schedule: Array.isArray(rest.weekly_schedule) ? rest.weekly_schedule : null,
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
  const { error: err } = await supabase!.from("courses").delete().eq("id", id);
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
