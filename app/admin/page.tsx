"use client";

import { useState, useEffect, useCallback } from "react";
import type { Profile, Course, Enrollment, Message } from "@/lib/supabase/types";

type Tab = "overview" | "students" | "courses" | "lessons" | "messages";

type EnrollmentRow = Enrollment & {
  student: Pick<Profile, "id" | "full_name" | "email"> | null;
  course: Pick<Course, "id" | "title"> | null;
};

type MessageRow = Message & {
  sender: Pick<Profile, "full_name" | "email"> | null;
  recipient: Pick<Profile, "full_name" | "email"> | null;
};

type DaySchedule = { enabled: boolean; time: string };

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Nybörjare",
  intermediate: "Mellannivå",
  advanced: "Avancerad",
};

const DAY_NAMES = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"];

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={`bg-white rounded-2xl shadow-xl w-full ${wide ? "max-w-lg" : "max-w-md"} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0] focus:border-transparent";
const btnPrimary = "px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all";
const btnSecondary = "px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all";

function generateLessonDates(startDateStr: string, weeksCount: number, daySchedules: DaySchedule[]): Date[] {
  if (!startDateStr) return [];
  const start = new Date(startDateStr + "T00:00:00");
  const startDayOfWeek = start.getDay();
  const daysFromMonday = (startDayOfWeek + 6) % 7;
  const monday = new Date(start);
  monday.setDate(start.getDate() - daysFromMonday);

  const dates: Date[] = [];
  for (let week = 0; week < weeksCount; week++) {
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      if (!daySchedules[dayIdx].enabled) continue;
      const d = new Date(monday);
      d.setDate(monday.getDate() + week * 7 + dayIdx);
      const [h, m] = daySchedules[dayIdx].time.split(":").map(Number);
      d.setHours(h, m, 0, 0);
      if (d >= start) dates.push(d);
    }
  }
  return dates.sort((a, b) => a.getTime() - b.getTime());
}

const defaultDays = (): DaySchedule[] =>
  Array.from({ length: 7 }, () => ({ enabled: false, time: "18:00" }));

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("overview");

  const [students, setStudents] = useState<Profile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [lessons, setLessons] = useState<{ id: string; title: string; scheduled_at: string | null; meeting_link: string | null; course_id?: string; course: { title: string } | null }[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [msgRecipient, setMsgRecipient] = useState<Profile | null>(null);

  const [courseForm, setCourseForm] = useState({ title: "", description: "", level: "beginner", price_sek: "", sessions_per_week: "2", duration_weeks: "" });
  const [bulkForm, setBulkForm] = useState({ course_id: "", title_prefix: "Lektion", start_date: "", weeks: "4", duration_minutes: "60", meeting_link: "", days: defaultDays() });
  const [studentForm, setStudentForm] = useState({ email: "", full_name: "", password: "" });
  const [enrollForm, setEnrollForm] = useState({ student_id: "", course_id: "" });
  const [msgForm, setMsgForm] = useState({ subject: "", content: "" });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    const [s, c, e, l, m] = await Promise.all([
      fetch("/api/admin/students").then((r) => r.json()),
      fetch("/api/admin/courses").then((r) => r.json()),
      fetch("/api/admin/enrollments").then((r) => r.json()),
      fetch("/api/admin/lessons").then((r) => r.json()),
      fetch("/api/admin/messages").then((r) => r.json()),
    ]);
    if (!s.error) setStudents(s);
    if (!c.error) setCourses(c);
    if (!e.error) setEnrollments(e);
    if (!l.error) setLessons(l);
    if (!m.error) setMessages(m);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toast = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(""), 3500); };

  // --- Courses ---
  const openCreateCourse = () => {
    setEditCourse(null);
    setCourseForm({ title: "", description: "", level: "beginner", price_sek: "", sessions_per_week: "2", duration_weeks: "" });
    setShowCourseModal(true);
  };
  const openEditCourse = (c: Course) => {
    setEditCourse(c);
    setCourseForm({ title: c.title, description: c.description ?? "", level: c.level ?? "beginner", price_sek: String(c.price_sek), sessions_per_week: String(c.sessions_per_week), duration_weeks: c.duration_weeks ? String(c.duration_weeks) : "" });
    setShowCourseModal(true);
  };
  const saveCourse = async () => {
    setSaving(true);
    const method = editCourse ? "PUT" : "POST";
    const body = editCourse ? { id: editCourse.id, ...courseForm } : courseForm;
    const res = await fetch("/api/admin/courses", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (res.ok) { setShowCourseModal(false); load(); toast(editCourse ? "Kurs uppdaterad!" : "Kurs skapad!"); }
    else toast("Något gick fel.");
  };
  const deleteCourse = async (id: string) => {
    if (!confirm("Ta bort kursen?")) return;
    await fetch("/api/admin/courses", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load(); toast("Kurs borttagen.");
  };

  // --- Bulk Lessons ---
  const openBulkModal = (courseId?: string) => {
    setBulkForm({ course_id: courseId ?? courses[0]?.id ?? "", title_prefix: "Lektion", start_date: "", weeks: "4", duration_minutes: "60", meeting_link: "", days: defaultDays() });
    setShowBulkModal(true);
  };

  const previewDates = generateLessonDates(bulkForm.start_date, parseInt(bulkForm.weeks) || 0, bulkForm.days);

  const saveBulkLessons = async () => {
    if (!bulkForm.course_id || previewDates.length === 0) { toast("Välj kurs, startdatum och minst en dag."); return; }
    setSaving(true);
    let failed = 0;
    for (let i = 0; i < previewDates.length; i++) {
      const res = await fetch("/api/admin/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: bulkForm.course_id,
          title: `${bulkForm.title_prefix} ${i + 1}`,
          scheduled_at: previewDates[i].toISOString(),
          duration_minutes: parseInt(bulkForm.duration_minutes) || 60,
          meeting_link: bulkForm.meeting_link || null,
        }),
      });
      if (!res.ok) failed++;
    }
    setSaving(false);
    setShowBulkModal(false);
    load();
    toast(failed > 0 ? `${previewDates.length - failed}/${previewDates.length} lektioner skapade.` : `${previewDates.length} lektioner skapade!`);
  };

  const deleteLesson = async (id: string) => {
    if (!confirm("Ta bort lektionen?")) return;
    await fetch("/api/admin/lessons", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load(); toast("Lektion borttagen.");
  };

  // --- Students ---
  const saveStudent = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(studentForm) });
    setSaving(false);
    if (res.ok) { setShowStudentModal(false); load(); toast("Elev skapad!"); }
    else { const d = await res.json(); toast(d.error ?? "Något gick fel."); }
  };
  const deleteStudent = async (id: string) => {
    if (!confirm("Ta bort eleven permanent?")) return;
    await fetch("/api/admin/students", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load(); toast("Elev borttagen.");
  };

  // --- Enrollments ---
  const saveEnroll = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/enrollments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(enrollForm) });
    setSaving(false);
    if (res.ok) { setShowEnrollModal(false); load(); toast("Elev tillagd i kurs!"); }
    else { const d = await res.json(); toast(d.error ?? "Något gick fel."); }
  };
  const removeEnroll = async (id: string) => {
    if (!confirm("Ta bort eleven från kursen?")) return;
    await fetch("/api/admin/enrollments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load(); toast("Borttagen från kurs.");
  };

  // --- Messages ---
  const openMsg = (student: Profile) => { setMsgRecipient(student); setMsgForm({ subject: "", content: "" }); setShowMsgModal(true); };
  const sendMsg = async () => {
    if (!msgRecipient) return;
    setSaving(true);
    const res = await fetch("/api/admin/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipient_id: msgRecipient.id, ...msgForm }) });
    setSaving(false);
    if (res.ok) { setShowMsgModal(false); load(); toast("Meddelande skickat!"); }
    else toast("Något gick fel.");
  };

  const totalRevenue = enrollments.filter((e) => e.payment_status === "paid")
    .reduce((sum, e) => sum + ((e.course as { price_sek?: number } | null)?.price_sek ?? 0), 0);

  const filteredLessons = selectedCourseId ? lessons.filter((l) => l.course_id === selectedCourseId) : lessons;

  return (
    <div className="min-h-screen bg-gray-50">
      {feedback && (
        <div className="fixed top-4 right-4 z-50 bg-[#7B3FB0] text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {feedback}
        </div>
      )}

      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Adminpanel</h1>
            <p className="text-xs text-gray-400">Korancenter – hantera elever, kurser och lektioner</p>
          </div>
          <a href="/" className="text-sm text-gray-500 hover:text-gray-700">← Tillbaka till hemsidan</a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8 flex-wrap">
          {([["overview", "Översikt"], ["students", "Elever"], ["courses", "Kurser"], ["lessons", "Lektioner"], ["messages", "Meddelanden"]] as [Tab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
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
                  {lessons.filter((l) => l.scheduled_at && new Date(l.scheduled_at) >= new Date()).slice(0, 5).map((l) => (
                    <div key={l.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#F5EEFF" }}>
                        <svg className="w-4 h-4" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{l.title}</p>
                        <p className="text-xs text-gray-400">
                          {l.scheduled_at ? new Date(l.scheduled_at).toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "–"}
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
        )}

        {/* STUDENTS */}
        {tab === "students" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Elever ({students.length})</h2>
              <div className="flex gap-2">
                <button onClick={() => { setEnrollForm({ student_id: "", course_id: "" }); setShowEnrollModal(true); }} className={btnSecondary}>+ Lägg till i kurs</button>
                <button onClick={() => { setStudentForm({ email: "", full_name: "", password: "" }); setShowStudentModal(true); }} className={btnPrimary} style={{ backgroundColor: "#7B3FB0" }}>+ Ny elev</button>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Elev</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Kurser</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Registrerad</th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {students.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400 text-sm">Inga elever ännu.</td></tr>
                    ) : students.map((s) => {
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
                            <div className="flex flex-wrap gap-1">
                              {studentEnrollments.length === 0 ? (
                                <span className="text-xs text-gray-400">Inga kurser</span>
                              ) : studentEnrollments.map((e) => (
                                <div key={e.id} className="flex items-center gap-1">
                                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F5EEFF", color: "#7B3FB0" }}>
                                    {(e.course as { title: string } | null)?.title ?? "–"}
                                  </span>
                                  <button onClick={() => removeEnroll(e.id)} className="text-gray-300 hover:text-red-400 text-xs">×</button>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-xs">{new Date(s.created_at).toLocaleDateString("sv-SE")}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 justify-end">
                              <button onClick={() => openMsg(s)} className="text-xs text-gray-400 hover:text-[#7B3FB0]">Meddelande</button>
                              <button onClick={() => deleteStudent(s.id)} className="text-xs text-gray-400 hover:text-red-500">Ta bort</button>
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
        )}

        {/* COURSES */}
        {tab === "courses" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Kurser ({courses.length})</h2>
              <button onClick={openCreateCourse} className={btnPrimary} style={{ backgroundColor: "#7B3FB0" }}>+ Ny kurs</button>
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
                      <button onClick={() => { setSelectedCourseId(c.id); openBulkModal(c.id); }} className={btnSecondary}>+ Lektioner</button>
                      <button onClick={() => openEditCourse(c)} className={btnSecondary}>Redigera</button>
                      <button onClick={() => deleteCourse(c.id)} className="px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50">Ta bort</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LESSONS */}
        {tab === "lessons" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Lektioner</h2>
                <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#7B3FB0]">
                  <option value="">Alla kurser</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <button onClick={() => openBulkModal(selectedCourseId || undefined)} className={btnPrimary} style={{ backgroundColor: "#7B3FB0" }}>
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
                      <button onClick={() => deleteLesson(l.id)} className="text-xs text-gray-400 hover:text-red-500 shrink-0">Ta bort</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MESSAGES */}
        {tab === "messages" && (
          <div className="space-y-6">
            {/* Send new message */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Skicka meddelande till elev</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.length === 0 ? (
                  <p className="text-sm text-gray-400 col-span-3">Inga elever att skriva till.</p>
                ) : students.map((s) => (
                  <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: "#7B3FB0" }}>
                      {(s.full_name ?? s.email ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{s.full_name ?? "–"}</p>
                      <p className="text-xs text-gray-400 truncate">{s.email}</p>
                    </div>
                    <button onClick={() => openMsg(s)} className="text-xs font-medium px-3 py-1.5 rounded-lg shrink-0" style={{ backgroundColor: "#F5EEFF", color: "#7B3FB0" }}>
                      Skriv
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Message history */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Skickade meddelanden ({messages.length})</h2>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {messages.length === 0 ? (
                  <div className="p-10 text-center text-gray-400 text-sm">Inga skickade meddelanden ännu.</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {messages.map((msg) => (
                      <div key={msg.id} className="px-6 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5" style={{ backgroundColor: "#7B3FB0" }}>
                              {(msg.recipient?.full_name ?? msg.recipient?.email ?? "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-gray-900">
                                  Till: {msg.recipient?.full_name ?? msg.recipient?.email ?? "–"}
                                </span>
                                {!msg.is_read && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">Oläst</span>
                                )}
                                {msg.is_read && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">Läst</span>
                                )}
                              </div>
                              {msg.subject && <p className="text-xs font-medium text-gray-600 mt-0.5">{msg.subject}</p>}
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{msg.content}</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 shrink-0 mt-1">
                            {new Date(msg.created_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* Course Modal */}
      {showCourseModal && (
        <Modal title={editCourse ? "Redigera kurs" : "Ny kurs"} onClose={() => setShowCourseModal(false)}>
          <div className="space-y-4">
            <Field label="Titel *"><input className={inputCls} value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} placeholder="T.ex. Koranläsning för nybörjare" /></Field>
            <Field label="Beskrivning"><textarea className={inputCls} rows={3} value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} /></Field>
            <Field label="Nivå">
              <select className={inputCls} value={courseForm.level} onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}>
                <option value="beginner">Nybörjare</option>
                <option value="intermediate">Mellannivå</option>
                <option value="advanced">Avancerad</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Pris (öre) *"><input className={inputCls} type="number" placeholder="49900 = 499 kr" value={courseForm.price_sek} onChange={(e) => setCourseForm({ ...courseForm, price_sek: e.target.value })} /></Field>
              <Field label="Lekt./vecka"><input className={inputCls} type="number" value={courseForm.sessions_per_week} onChange={(e) => setCourseForm({ ...courseForm, sessions_per_week: e.target.value })} /></Field>
            </div>
            <Field label="Längd (veckor)"><input className={inputCls} type="number" placeholder="Lämna tomt om löpande" value={courseForm.duration_weeks} onChange={(e) => setCourseForm({ ...courseForm, duration_weeks: e.target.value })} /></Field>
            <div className="flex gap-2 pt-2">
              <button onClick={saveCourse} disabled={saving} className={`flex-1 ${btnPrimary}`} style={{ backgroundColor: "#7B3FB0" }}>{saving ? "Sparar..." : editCourse ? "Spara ändringar" : "Skapa kurs"}</button>
              <button onClick={() => setShowCourseModal(false)} className={btnSecondary}>Avbryt</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk Lesson Modal */}
      {showBulkModal && (
        <Modal title="Lägg till lektioner" onClose={() => setShowBulkModal(false)} wide>
          <div className="space-y-4">
            <Field label="Kurs *">
              <select className={inputCls} value={bulkForm.course_id} onChange={(e) => setBulkForm({ ...bulkForm, course_id: e.target.value })}>
                <option value="">Välj kurs...</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Titelprefx"><input className={inputCls} value={bulkForm.title_prefix} onChange={(e) => setBulkForm({ ...bulkForm, title_prefix: e.target.value })} placeholder="Lektion" /></Field>
              <Field label="Antal veckor"><input className={inputCls} type="number" min="1" max="52" value={bulkForm.weeks} onChange={(e) => setBulkForm({ ...bulkForm, weeks: e.target.value })} /></Field>
            </div>

            <Field label="Startdatum *">
              <input className={inputCls} type="date" value={bulkForm.start_date} onChange={(e) => setBulkForm({ ...bulkForm, start_date: e.target.value })} />
            </Field>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Veckodagar & tider *</label>
              <div className="space-y-2 rounded-xl border border-gray-100 p-3 bg-gray-50">
                {DAY_NAMES.map((day, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={bulkForm.days[idx].enabled}
                        onChange={(e) => {
                          const days = [...bulkForm.days];
                          days[idx] = { ...days[idx], enabled: e.target.checked };
                          setBulkForm({ ...bulkForm, days });
                        }}
                        className="w-4 h-4 rounded accent-[#7B3FB0]"
                      />
                      <span className="text-sm text-gray-700 w-20">{day}</span>
                    </label>
                    {bulkForm.days[idx].enabled && (
                      <input
                        type="time"
                        value={bulkForm.days[idx].time}
                        onChange={(e) => {
                          const days = [...bulkForm.days];
                          days[idx] = { ...days[idx], time: e.target.value };
                          setBulkForm({ ...bulkForm, days });
                        }}
                        className="px-2 py-1 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0]"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Längd (min)"><input className={inputCls} type="number" value={bulkForm.duration_minutes} onChange={(e) => setBulkForm({ ...bulkForm, duration_minutes: e.target.value })} /></Field>
              <Field label="Möteslänk"><input className={inputCls} value={bulkForm.meeting_link} onChange={(e) => setBulkForm({ ...bulkForm, meeting_link: e.target.value })} placeholder="meet.google.com/..." /></Field>
            </div>

            {/* Preview */}
            {previewDates.length > 0 && (
              <div className="rounded-xl bg-purple-50 border border-purple-100 p-3">
                <p className="text-xs font-semibold text-purple-700 mb-2">{previewDates.length} lektioner kommer skapas:</p>
                <div className="max-h-32 overflow-y-auto space-y-0.5">
                  {previewDates.map((d, i) => (
                    <p key={i} className="text-xs text-purple-600">
                      {bulkForm.title_prefix} {i + 1} – {d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {bulkForm.start_date && previewDates.length === 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">Välj minst en dag i veckan.</p>
            )}

            <div className="flex gap-2 pt-2">
              <button onClick={saveBulkLessons} disabled={saving || previewDates.length === 0} className={`flex-1 ${btnPrimary}`} style={{ backgroundColor: "#7B3FB0" }}>
                {saving ? "Skapar..." : `Skapa ${previewDates.length > 0 ? previewDates.length + " " : ""}lektioner`}
              </button>
              <button onClick={() => setShowBulkModal(false)} className={btnSecondary}>Avbryt</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Student Modal */}
      {showStudentModal && (
        <Modal title="Ny elev" onClose={() => setShowStudentModal(false)}>
          <div className="space-y-4">
            <Field label="Fullständigt namn"><input className={inputCls} value={studentForm.full_name} onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })} placeholder="Fatima Svensson" /></Field>
            <Field label="E-postadress *"><input className={inputCls} type="email" value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} placeholder="fatima@example.com" /></Field>
            <Field label="Tillfälligt lösenord *"><input className={inputCls} type="password" value={studentForm.password} onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })} placeholder="Minst 6 tecken" /></Field>
            <p className="text-xs text-gray-400">Eleven kan byta lösenord via "Glömt lösenord" på inloggningssidan.</p>
            <div className="flex gap-2 pt-2">
              <button onClick={saveStudent} disabled={saving} className={`flex-1 ${btnPrimary}`} style={{ backgroundColor: "#7B3FB0" }}>{saving ? "Skapar..." : "Skapa elev"}</button>
              <button onClick={() => setShowStudentModal(false)} className={btnSecondary}>Avbryt</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Enroll Modal */}
      {showEnrollModal && (
        <Modal title="Lägg till elev i kurs" onClose={() => setShowEnrollModal(false)}>
          <div className="space-y-4">
            <Field label="Elev *">
              <select className={inputCls} value={enrollForm.student_id} onChange={(e) => setEnrollForm({ ...enrollForm, student_id: e.target.value })}>
                <option value="">Välj elev...</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name ?? s.email}</option>)}
              </select>
            </Field>
            <Field label="Kurs *">
              <select className={inputCls} value={enrollForm.course_id} onChange={(e) => setEnrollForm({ ...enrollForm, course_id: e.target.value })}>
                <option value="">Välj kurs...</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </Field>
            <div className="flex gap-2 pt-2">
              <button onClick={saveEnroll} disabled={saving} className={`flex-1 ${btnPrimary}`} style={{ backgroundColor: "#7B3FB0" }}>{saving ? "Lägger till..." : "Lägg till"}</button>
              <button onClick={() => setShowEnrollModal(false)} className={btnSecondary}>Avbryt</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Message Modal */}
      {showMsgModal && msgRecipient && (
        <Modal title={`Meddelande till ${msgRecipient.full_name ?? msgRecipient.email}`} onClose={() => setShowMsgModal(false)}>
          <div className="space-y-4">
            <Field label="Ämne"><input className={inputCls} value={msgForm.subject} onChange={(e) => setMsgForm({ ...msgForm, subject: e.target.value })} placeholder="T.ex. Feedback från lektionen" /></Field>
            <Field label="Meddelande *"><textarea className={inputCls} rows={5} value={msgForm.content} onChange={(e) => setMsgForm({ ...msgForm, content: e.target.value })} placeholder="Skriv ditt meddelande här..." /></Field>
            <div className="flex gap-2 pt-2">
              <button onClick={sendMsg} disabled={saving || !msgForm.content} className={`flex-1 ${btnPrimary}`} style={{ backgroundColor: "#7B3FB0" }}>{saving ? "Skickar..." : "Skicka"}</button>
              <button onClick={() => setShowMsgModal(false)} className={btnSecondary}>Avbryt</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
