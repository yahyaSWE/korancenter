import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Schema() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/logga-in");

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("student_id", user.id)
    .eq("payment_status", "paid");

  const courseIds = enrollments?.map((e) => e.course_id) ?? [];

  const { data: lessons } = courseIds.length > 0
    ? await supabase
        .from("lessons")
        .select("*, course:courses(title)")
        .in("course_id", courseIds)
        .eq("is_cancelled", false)
        .order("scheduled_at", { ascending: true })
    : { data: [] };

  const now = new Date();
  const upcoming = (lessons ?? []).filter((l) => l.scheduled_at && new Date(l.scheduled_at) >= now);
  const completed = [...(lessons ?? []).filter((l) => l.scheduled_at && new Date(l.scheduled_at) < now)].reverse();

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const fmtTime = (iso: string, mins: number) => {
    const s = new Date(iso);
    const e = new Date(s.getTime() + mins * 60000);
    return `${s.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}–${e.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Schema</h1>
        <p className="text-gray-500 mt-1">Dina kommande och genomförda lektioner.</p>
      </div>

      {/* Kommande */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Kommande lektioner ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            Inga kommande lektioner inbokade.
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((lesson) => (
              <div key={lesson.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#F5EEFF" }}>
                  <svg className="w-6 h-6" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{lesson.title}</p>
                  <p className="text-xs text-gray-400">{lesson.scheduled_at ? fmtDate(lesson.scheduled_at) : "–"}</p>
                  <p className="text-xs text-gray-400">
                    {lesson.scheduled_at ? fmtTime(lesson.scheduled_at, lesson.duration_minutes) : ""} ·{" "}
                    {(lesson.course as { title: string } | null)?.title}
                  </p>
                </div>
                {lesson.meeting_link ? (
                  <a href={lesson.meeting_link} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white shrink-0"
                    style={{ backgroundColor: "#7B3FB0" }}>
                    Gå med
                  </a>
                ) : (
                  <span className="text-xs text-gray-400 shrink-0">Länk saknas</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Genomförda */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Genomförda lektioner ({completed.length})
        </h2>
        {completed.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            Inga genomförda lektioner än.
          </div>
        ) : (
          <div className="space-y-3">
            {completed.map((lesson) => (
              <div key={lesson.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 opacity-70">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gray-100">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-700 text-sm">{lesson.title}</p>
                  <p className="text-xs text-gray-400">{lesson.scheduled_at ? fmtDate(lesson.scheduled_at) : "–"}</p>
                </div>
                <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 shrink-0">Genomförd</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
