import type { Course } from "@/lib/supabase/types";
import type { EnrollmentRow } from "./types";
import { LEVEL_LABELS, btnPrimary, btnSecondary } from "./types";

type Props = {
  courses: Course[];
  enrollments: EnrollmentRow[];
  onCreateCourse: () => void;
  onEditCourse: (c: Course) => void;
  onDeleteCourse: (id: string) => void;
  onBulkLessons: (courseId: string) => void;
};

export function CoursesTab({ courses, enrollments, onCreateCourse, onEditCourse, onDeleteCourse, onBulkLessons }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Kurser ({courses.length})</h2>
        <button onClick={onCreateCourse} className={btnPrimary} style={{ backgroundColor: "#7B3FB0" }}>+ Ny kurs</button>
      </div>
      <div className="space-y-3">
        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">Inga kurser ännu. Skapa din första kurs!</div>
        ) : courses.map((c) => {
          const enrolled = enrollments.filter((e) => e.course_id === c.id && e.payment_status === "paid").length;
          return (
            <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {c.level && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F5EEFF", color: "#7B3FB0" }}>
                      {LEVEL_LABELS[c.level] ?? c.level}
                    </span>
                  )}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.is_active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                    {c.is_active ? "Aktiv" : "Inaktiv"}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">{c.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {(c.price_sek / 100).toLocaleString("sv-SE")} kr/mån · {enrolled} elever · {c.sessions_per_week} lekt/vecka
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => onBulkLessons(c.id)} className={btnSecondary}>+ Lektioner</button>
                <button onClick={() => onEditCourse(c)} className={btnSecondary}>Redigera</button>
                <button onClick={() => onDeleteCourse(c.id)} className="px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50">Ta bort</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
