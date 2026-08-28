import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runApprovalFlow } from "@/lib/approval";
import { attachPaymentStatuses } from "@/lib/application-payment";
import { NextRequest, NextResponse } from "next/server";

async function getTeacher() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Ej inloggad" }, { status: 401 }), user: null };

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "teacher" && profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Ej behörig" }, { status: 403 }), user: null };
  }
  return { error: null, user };
}

export async function GET() {
  const { error, user } = await getTeacher();
  if (error) return error;

  const admin = createAdminClient();

  // Get courses taught by this teacher
  const { data: courses, error: coursesError } = await admin
    .from("courses")
    .select("id")
    .eq("teacher_id", user!.id);

  if (coursesError) return NextResponse.json({ error: coursesError.message }, { status: 500 });

  const courseIds = (courses ?? []).map((c) => c.id);
  if (courseIds.length === 0) return NextResponse.json([]);

  const { data, error: err } = await admin
    .from("applications")
    .select("*, course:courses!course_id(id, title), redirect_course:courses!redirect_course_id(id, title)")
    .in("course_id", courseIds)
    .order("created_at", { ascending: false });

  if (err) return NextResponse.json({ error: err.message }, { status: 500 });
  try {
    return NextResponse.json(await attachPaymentStatuses(data ?? []));
  } catch (paymentError) {
    const message = paymentError instanceof Error ? paymentError.message : "Kunde inte läsa betalningsstatus";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { error, user } = await getTeacher();
  if (error) return error;

  const { id, status, redirect_course_id, admin_notes } = await req.json();
  if (!id || !["approved", "rejected", "redirected"].includes(status)) {
    return NextResponse.json({ error: "Ogiltiga parametrar" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Hämta ansökan + verifiera att läraren äger kursen
  const { data: application } = await admin
    .from("applications")
    .select("*, course:courses!course_id(id, title, teacher_id, stripe_price_id, is_subscription, is_active), redirect_course:courses!redirect_course_id(id, title)")
    .eq("id", id)
    .single();

  if (!application) return NextResponse.json({ error: "Ansökan hittades inte" }, { status: 404 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((application as any).course?.teacher_id !== user!.id) {
    // Tillåt admins ändå
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user!.id).single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Ej behörig" }, { status: 403 });
    }
  }

  const result = await runApprovalFlow({
    application,
    status,
    reviewerId: user!.id,
    redirectCourseId: redirect_course_id,
    adminNotes: admin_notes,
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result);
}
