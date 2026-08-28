import { createAdminClient } from "@/lib/supabase/admin";

export type ApplicationPaymentStatus = "paid" | "pending" | "cancelled" | "refunded" | null;

type PaymentAwareApplication = {
  course_id: string;
  email: string;
  status: string;
  payment_status?: ApplicationPaymentStatus;
};

/** Delas av admin- och lärarvyn så att båda ser samma betalningsstatus. */
export async function attachPaymentStatuses<T extends PaymentAwareApplication>(apps: T[]): Promise<T[]> {
  const approvedApps = apps.filter((app) => app.status === "approved" && app.email && app.course_id);
  if (approvedApps.length === 0) return apps;

  const admin = createAdminClient();
  const emails = Array.from(new Set(approvedApps.map((app) => app.email.trim().toLowerCase())));
  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, email")
    .in("email", emails);
  if (profilesError) throw new Error(`Kunde inte läsa elevprofiler: ${profilesError.message}`);

  const emailToId = new Map<string, string>();
  for (const profile of profiles ?? []) {
    if (profile.email) emailToId.set(profile.email.toLowerCase(), profile.id);
  }

  const studentIds = Array.from(emailToId.values());
  const courseIds = Array.from(new Set(approvedApps.map((app) => app.course_id)));
  if (studentIds.length === 0 || courseIds.length === 0) return apps;

  const { data: enrollments, error: enrollmentsError } = await admin
    .from("enrollments")
    .select("student_id, course_id, payment_status")
    .in("student_id", studentIds)
    .in("course_id", courseIds);
  if (enrollmentsError) throw new Error(`Kunde inte läsa kursplatser: ${enrollmentsError.message}`);

  const enrollMap = new Map<string, ApplicationPaymentStatus>();
  for (const enrollment of enrollments ?? []) {
    enrollMap.set(
      `${enrollment.student_id}::${enrollment.course_id}`,
      enrollment.payment_status as ApplicationPaymentStatus,
    );
  }

  return apps.map((app) => {
    if (app.status !== "approved") return app;
    const studentId = emailToId.get(app.email.trim().toLowerCase());
    return {
      ...app,
      payment_status: studentId
        ? (enrollMap.get(`${studentId}::${app.course_id}`) ?? null)
        : null,
    };
  });
}
