import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const levelLabels: Record<string, string> = {
  beginner: "Nybörjare",
  intermediate: "Mellannivå",
  advanced: "Avancerad",
};

export default async function MinaKurser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/logga-in");

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("*, course:courses(*, teacher:profiles!teacher_id(full_name))")
    .eq("student_id", user.id)
    .eq("payment_status", "paid");

  const enriched = await Promise.all(
    (enrollments ?? []).map(async (enrollment) => {
      const [{ count: total }, { count: completed }, { data: nextLessons }] = await Promise.all([
        supabase
          .from("lessons")
          .select("*", { count: "exact", head: true })
          .eq("course_id", enrollment.course_id)
          .eq("is_cancelled", false),
        supabase
          .from("lessons")
          .select("*", { count: "exact", head: true })
          .eq("course_id", enrollment.course_id)
          .eq("is_cancelled", false)
          .lt("scheduled_at", new Date().toISOString()),
        supabase
          .from("lessons")
          .select("scheduled_at, meeting_link, title")
          .eq("course_id", enrollment.course_id)
          .eq("is_cancelled", false)
          .gte("scheduled_at", new Date().toISOString())
          .order("scheduled_at", { ascending: true })
          .limit(1),
      ]);

      return {
        ...enrollment,
        total: total ?? 0,
        completed: completed ?? 0,
        progress: total ? Math.round(((completed ?? 0) / total) * 100) : 0,
        nextLesson: nextLessons?.[0] ?? null,
      };
    })
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mina kurser</h1>
        <p className="text-gray-500 mt-1">Översikt över dina registrerade kurser.</p>
      </div>

      {enriched.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#F5EEFF" }}>
            <svg className="w-8 h-8" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Inga kurser ännu</h3>
          <p className="text-gray-500 text-sm mb-6">Du är inte anmäld till någon kurs ännu.</p>
          <Link href="/kurser" className="inline-flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-xl" style={{ backgroundColor: "#7B3FB0" }}>
            Se tillgängliga kurser
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {enriched.map((e) => {
            const course = e.course as { title: string; level: string | null; teacher?: { full_name: string } | null } | null;
            const next = e.nextLesson as { scheduled_at: string; meeting_link: string | null; title: string } | null;
            const nextDate = next?.scheduled_at ? new Date(next.scheduled_at) : null;
            const nextStr = nextDate
              ? nextDate.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" }) +
                " " +
                nextDate.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })
              : null;

            return (
              <div key={e.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {course?.level && (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "#F5EEFF", color: "#7B3FB0" }}>
                          {levelLabels[course.level] ?? course.level}
                        </span>
                      )}
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-600">Aktiv</span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">{course?.title}</h2>
                    {course?.teacher && <p className="text-sm text-gray-500">Lärare: {course.teacher.full_name}</p>}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-500">Framsteg</span>
                    <span className="font-medium text-gray-900">{e.completed} / {e.total} lektioner</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${e.progress}%`, backgroundColor: "#7B3FB0" }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{e.progress}% slutfört</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Nästa lektion</p>
                    <p className="text-sm font-medium text-gray-700">{nextStr ?? "Inga inbokade lektioner"}</p>
                  </div>
                  {next?.meeting_link && (
                    <a href={next.meeting_link} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-semibold px-4 py-2 rounded-xl text-white hover:opacity-90"
                      style={{ backgroundColor: "#7B3FB0" }}>
                      Gå med i lektion
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
