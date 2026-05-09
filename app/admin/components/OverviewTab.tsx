import type { Profile, Course } from "@/lib/supabase/types";
import type { EnrollmentRow, LessonRow } from "./types";

type Props = {
  students: Profile[];
  courses: Course[];
  enrollments: EnrollmentRow[];
  lessons: LessonRow[];
  totalRevenue: number;
};

export function OverviewTab({ students, courses, enrollments, lessons, totalRevenue }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Totalt elever", value: students.length },
          { label: "Aktiva kurser", value: courses.filter((c) => c.is_active).length },
          { label: "Totala enrollments", value: enrollments.filter((e) => e.payment_status === "paid").length },
          { label: "Intäkter totalt", value: `${(totalRevenue / 100).toLocaleString("sv-SE")} kr` },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Senast anmälda elever</h2>
          <div className="space-y-3">
            {students.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: "#7B3FB0" }}>
                  {(s.full_name ?? s.email ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.full_name ?? "–"}</p>
                  <p className="text-xs text-gray-400 truncate">{s.email}</p>
                </div>
              </div>
            ))}
            {students.length === 0 && <p className="text-sm text-gray-400">Inga elever ännu.</p>}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Kommande lektioner</h2>
          <div className="space-y-3">
            {lessons
              .filter((l) => l.scheduled_at && new Date(l.scheduled_at) >= new Date())
              .slice(0, 5)
              .map((l) => (
                <div key={l.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#F5EEFF" }}>
                    <svg className="w-4 h-4" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{l.title}</p>
                    <p className="text-xs text-gray-400">
                      {l.scheduled_at
                        ? new Date(l.scheduled_at).toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                        : "–"}
                    </p>
                  </div>
                </div>
              ))}
            {lessons.filter((l) => l.scheduled_at && new Date(l.scheduled_at) >= new Date()).length === 0 && (
              <p className="text-sm text-gray-400">Inga kommande lektioner.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
