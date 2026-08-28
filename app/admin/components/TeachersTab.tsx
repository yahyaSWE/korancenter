import type { Profile, Course } from "@/lib/supabase/types";

type Props = {
  students: Profile[];
  courses: Course[];
  onMessage: (t: Profile) => void;
  onChangeRole: (id: string, role: "student" | "teacher") => void;
  onDelete: (id: string) => void;
};

export function TeachersTab({ students, courses, onMessage, onChangeRole, onDelete }: Props) {
  const teachers = students.filter((s) => s.role === "teacher");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Lärare ({teachers.length})</h2>
        <p className="text-sm text-gray-400">Utse lärare via elevlistan eller skapa ett konto och ändra roll.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Lärare</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tilldelade kurser</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {teachers.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-10 text-center text-gray-400 text-sm">Inga lärare ännu. Gå till Elever-fliken och klicka &quot;→ Lärare&quot; på en användare.</td></tr>
              ) : teachers.map((t) => {
                const teacherCourses = courses.filter((c) => c.teacher_id === t.id);
                return (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: "#7B3FB0" }}>
                          {(t.full_name ?? t.email ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{t.full_name ?? "–"}</p>
                          <p className="text-xs text-gray-400">{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {teacherCourses.length === 0 ? (
                          <span className="text-xs text-gray-400">Inga kurser tilldelade</span>
                        ) : teacherCourses.map((c) => (
                          <span key={c.id} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#F5EEFF", color: "#7B3FB0" }}>
                            {c.title}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 justify-end">
                        <button onClick={() => onMessage(t)} className="text-xs text-gray-400 hover:text-[#7B3FB0]">Meddelande</button>
                        <button onClick={() => onChangeRole(t.id, "student")} className="text-xs text-amber-500 hover:text-amber-700">→ Elev</button>
                        <button onClick={() => onDelete(t.id)} className="text-xs text-gray-400 hover:text-red-500">Ta bort</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
