import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { data, error: err } = await supabase!
    .from("materials")
    .select("*, course:courses(id, title), lesson:lessons(id, title)")
    .order("created_at", { ascending: false });

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string;
  const course_id = (formData.get("course_id") as string) || null;
  const lesson_id = formData.get("lesson_id") as string | null;
  const type = formData.get("type") as string | null;

  if (!file || !title) {
    return NextResponse.json({ error: "fil och titel krävs" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const folder = course_id ?? "general";
  const path = `${folder}/${Date.now()}-${safeName}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadErr } = await adminClient.storage
    .from("materials")
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: { publicUrl } } = adminClient.storage.from("materials").getPublicUrl(path);

  const { data, error: dbErr } = await adminClient
    .from("materials")
    .insert({
      title,
      course_id: course_id || null,
      lesson_id: lesson_id || null,
      type: type || null,
      url: publicUrl,
      file_size_bytes: file.size,
    })
    .select()
    .single();

  if (dbErr) {
    await adminClient.storage.from("materials").remove([path]);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id, url } = await req.json();
  const adminClient = createAdminClient();

  if (url) {
    try {
      const marker = "/object/public/materials/";
      const idx = url.indexOf(marker);
      if (idx !== -1) {
        const storagePath = url.slice(idx + marker.length);
        await adminClient.storage.from("materials").remove([storagePath]);
      }
    } catch { /* ignore */ }
  }

  const { error: err } = await adminClient.from("materials").delete().eq("id", id);
  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
