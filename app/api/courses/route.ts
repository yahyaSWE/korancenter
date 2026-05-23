import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Förhindra Next.js från att cacha resultatet på build-time
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const admin = createAdminClient();

  const [{ data: courses }, { data: enrollments }] = await Promise.all([
    admin.from("courses").select("*").eq("is_active", true).order("price_sek", { ascending: true }),
    admin.from("enrollments").select("course_id").eq("payment_status", "paid"),
  ]);

  const countMap: Record<string, number> = {};
  for (const e of enrollments ?? []) {
    countMap[e.course_id] = (countMap[e.course_id] ?? 0) + 1;
  }

  const result = (courses ?? []).map((c) => ({
    ...c,
    enrolled_count: countMap[c.id] ?? 0,
  }));

  return NextResponse.json(result, {
    headers: {
      // Säg åt browser/CDN att inte cacha svar — vi vill alltid ha fräscha siffror
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
