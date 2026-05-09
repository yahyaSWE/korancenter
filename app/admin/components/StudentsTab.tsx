import type { Profile } from "@/lib/supabase/types";
import type { EnrollmentRow } from "./types";
import { btnPrimary, btnSecondary } from "./types";

type Props = {
  students: Profile[];
  enrollments: EnrollmentRow[];
  onNewStudent: () => void;
  onEnroll: () => void;
  onMessage: (s: Profile) => void;
  onChangeRole: (id: string, role: "student" | "teacher") => void;
  onDelete: (id: string) => void;
  onRemoveEnroll: (id: string) => void;
};

export function StudentsTab({ students, enrollments, onNewStudent, onEnroll, onMessage, onChangeRole, onDelete, onRemoveEnroll }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Elever ({students.filter((s) => s.role === "student").length})</h2>
        <div className="flex gap-2">
          <button onClick={onEnroll} className={btnSecondary}>+ Lägg till i kurs</button>
          <button onClick={onNewStudent} className={btnPrimary} style={{ backgroundColor: "#7B3FB0" }}>+ Ny elev</button>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Användare</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Roll</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Kurser</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Registrerad</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400 text-sm">Inga elever ännu.</td></tr>
              ) : students.filter((s) => s.role === "student").map((s) => {
                const studentEnrollments = enrollments.filter((e) => e.student_id === s.id && e.payment_status === "paid");
                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "#7B3FB0" }}>
                          {(s.full_name ?? s.email ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{s.full_name ?? "–"}</p>
                          <p className="text-xs text-gray-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.role === "teacher" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
                        {s.role === "teacher" ? "Lärare" : "Elev"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {studentEnrollments.length === 0 ? (
                          <span className="text-xs text-gray-400">Inga kurser</span>
                        ) : studentEnrollments.map((e) => (
                          <div key={e.id} className="flex items-center gap-1">
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F5EEFF", color: "#7B3FB0" }}>
                              {(e.course as { title: string } | null)?.title ?? "–"}
                            </span>
                            <button onClick={() => onRemoveEnroll(e.id)} className="text-gray-300 hover:text-red-400 text-xs">×</button>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{new Date(s.created_at).toLocaleDateString("sv-SE")}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end flex-wrap">
                        <button onClick={() => onMessage(s)} className="text-xs text-gray-400 hover:text-[#7B3FB0]">Meddelande</button>
                        <button onClick={() => onChangeRole(s.id, "teacher")} className="text-xs text-green-600 hover:text-green-800">→ Lärare</button>
                        <button onClick={() => onDelete(s.id)} className="text-xs text-gray-400 hover:text-red-500">Ta bort</button>
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
