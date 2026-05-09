import type { Course } from "@/lib/supabase/types";
import type { LessonRow } from "./types";
import { btnPrimary } from "./types";

type Props = {
  lessons: LessonRow[];
  courses: Course[];
  selectedCourseId: string;
  onSelectCourse: (id: string) => void;
  onAddLessons: (courseId?: string) => void;
  onDeleteLesson: (id: string) => void;
};

export function LessonsTab({ lessons, courses, selectedCourseId, onSelectCourse, onAddLessons, onDeleteLesson }: Props) {
  const filteredLessons = selectedCourseId ? lessons.filter((l) => l.course_id === selectedCourseId) : lessons;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Lektioner</h2>
          <select
            value={selectedCourseId}
            onChange={(e) => onSelectCourse(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#7B3FB0]"
          >
            <option value="">Alla kurser</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <button onClick={() => onAddLessons(selectedCourseId || undefined)} className={btnPrimary} style={{ backgroundColor: "#7B3FB0" }}>
          + Lägg till lektioner
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {filteredLessons.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">Inga lektioner ännu.</div>
          ) : filteredLessons.map((l) => {
            const d = l.scheduled_at ? new Date(l.scheduled_at) : null;
            const isPast = d && d < new Date();
            return (
              <div key={l.id} className={`px-6 py-4 flex items-center gap-4 ${isPast ? "opacity-60" : ""}`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: isPast ? "#F3F4F6" : "#F5EEFF" }}>
                  <svg className="w-5 h-5" style={{ color: isPast ? "#9CA3AF" : "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{l.title}</p>
                  <p className="text-xs text-gray-400">
                    {l.course?.title} ·{" "}
                    {d ? d.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Ingen tid"}
                  </p>
                  {l.meeting_link && (
                    <a href={l.meeting_link} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: "#7B3FB0" }}>Möteslänk</a>
                  )}
                </div>
                <button onClick={() => onDeleteLesson(l.id)} className="text-xs text-gray-400 hover:text-red-500 shrink-0">Ta bort</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
