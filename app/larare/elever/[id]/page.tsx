"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Enrollment = {
  id: string;
  student: { id: string; full_name: string | null; email: string | null; created_at: string } | null;
  course: { id: string; title: string } | null;
};

type LessonNote = {
  id: string;
  student_id: string;
  course_id: string;
  teacher_id: string | null;
  lesson_date: string;
  summary: string | null;
  homework: string | null;
  notes: string | null;
  created_at: string;
  course: { id: string; title: string } | null;
};

type NoteForm = { lesson_date: string; summary: string; homework: string; notes: string };

function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

const emptyForm = (): NoteForm => ({ lesson_date: todayISO(), summary: "", homework: "", notes: "" });

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default function ElevDetalj() {
  const params = useParams<{ id: string }>();
  const studentId = params.id;

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [forms, setForms] = useState<Record<string, NoteForm>>({});
  const [savingCourseId, setSavingCourseId] = useState<string | null>(null);
  const [savedCourseId, setSavedCourseId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [studentsRes, notesRes] = await Promise.all([
      fetch("/api/teacher/students").then((r) => r.json()),
      fetch(`/api/teacher/students/${studentId}/progress`).then((r) => r.json()),
    ]);
    if (Array.isArray(studentsRes)) {
      setEnrollments(studentsRes.filter((e: Enrollment) => e.student?.id === studentId));
    }
    if (Array.isArray(notesRes)) setNotes(notesRes);
    setLoading(false);
  }, [studentId]);

  // Datahämtning vid montering är avsiktlig för den klientrenderade elevvyn.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const student = enrollments[0]?.student ?? null;
  const courses: { id: string; title: string }[] = [];
  const seen = new Set<string>();
  for (const e of enrollments) {
    if (e.course?.id && !seen.has(e.course.id)) {
      seen.add(e.course.id);
      courses.push(e.course);
    }
  }

  const getForm = (courseId: string) => forms[courseId] ?? emptyForm();
  const setField = (courseId: string, field: keyof NoteForm, value: string) => {
    setForms((prev) => ({
      ...prev,
      [courseId]: { ...(prev[courseId] ?? emptyForm()), [field]: value },
    }));
  };

  const save = async (courseId: string) => {
    const form = getForm(courseId);
    if (!form.summary.trim() && !form.homework.trim() && !form.notes.trim()) return;
    setSavingCourseId(courseId);
    const res = await fetch(`/api/teacher/students/${studentId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: courseId, ...form }),
    });
    setSavingCourseId(null);
    if (res.ok) {
      const created: LessonNote = await res.json();
      setNotes((prev) => [created, ...prev]);
      setForms((prev) => ({ ...prev, [courseId]: emptyForm() }));
      setSavedCourseId(courseId);
      setTimeout(() => setSavedCourseId(null), 2000);
    }
  };

  const remove = async (noteId: string) => {
    if (!confirm("Ta bort denna anteckning?")) return;
    setDeletingId(noteId);
    const res = await fetch(`/api/teacher/students/${studentId}/progress?note_id=${noteId}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#7B3FB0", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="max-w-3xl mx-auto">
        <Link href="/larare/elever" className="text-sm hover:underline" style={{ color: "#7B3FB0" }}>← Tillbaka till elever</Link>
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center mt-4">
          <p className="text-gray-400">Eleven hittades inte eller är inte i någon av dina kurser.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/larare/elever" className="text-sm hover:underline inline-flex items-center gap-1" style={{ color: "#7B3FB0" }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Tillbaka till elever
      </Link>

      {/* Student header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0" style={{ backgroundColor: "#7B3FB0" }}>
          {(student.full_name ?? student.email ?? "?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{student.full_name ?? "–"}</h1>
          <p className="text-sm text-gray-500 truncate">{student.email}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {courses.map((c) => (
              <span key={c.id} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#F5EEFF", color: "#7B3FB0" }}>
                {c.title}
              </span>
            ))}
          </div>
        </div>
        <Link
          href="/larare/meddelanden"
          className="text-xs font-medium px-3 py-2 rounded-lg shrink-0"
          style={{ backgroundColor: "#F5EEFF", color: "#7B3FB0" }}
        >
          Skicka meddelande
        </Link>
      </div>

      {/* Per course */}
      {courses.map((course) => {
        const form = getForm(course.id);
        const courseNotes = notes
          .filter((n) => n.course_id === course.id)
          .sort((a, b) => {
            const d = new Date(b.lesson_date).getTime() - new Date(a.lesson_date).getTime();
            return d !== 0 ? d : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
        const isSaving = savingCourseId === course.id;
        const isSaved = savedCourseId === course.id;

        return (
          <div key={course.id} className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">{course.title}</h2>
              <span className="text-xs text-gray-400">· {courseNotes.length} anteckning{courseNotes.length === 1 ? "" : "ar"}</span>
            </div>

            {/* Add-note form */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">Ny anteckning</h3>
                {isSaved && <span className="text-xs font-medium px-2 py-1 rounded-lg bg-green-50 text-green-600">✓ Sparat</span>}
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Lektionsdatum</label>
                  <input
                    type="date"
                    value={form.lesson_date}
                    onChange={(e) => setField(course.id, "lesson_date", e.target.value)}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <svg className="w-4 h-4" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Vad gjorde ni denna lektion?
                  </label>
                  <textarea
                    rows={2}
                    value={form.summary}
                    onChange={(e) => setField(course.id, "summary", e.target.value)}
                    placeholder="T.ex. Sura Al-Baqarah, vers 25–30. Tajwid-regel: madd lazim."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0] focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <svg className="w-4 h-4" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Läxa till nästa gång <span className="text-xs font-normal text-gray-400">(syns för eleven)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={form.homework}
                    onChange={(e) => setField(course.id, "homework", e.target.value)}
                    placeholder="T.ex. Memorera vers 31–35. Öva uttal av qalqalah-bokstäverna."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0] focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <svg className="w-4 h-4" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                    Interna anteckningar <span className="text-xs font-normal text-gray-400">(endast du ser detta)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setField(course.id, "notes", e.target.value)}
                    placeholder="T.ex. Eleven har svårt med ghunna. Repetera grunderna i nasalisering nästa gång."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0] focus:border-transparent resize-none"
                  />
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => save(course.id)}
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: "#7B3FB0" }}
                  >
                    {isSaving ? "Sparar..." : "Spara anteckning"}
                  </button>
                </div>
              </div>
            </div>

            {/* History timeline */}
            {courseNotes.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Tidigare anteckningar</p>
                <div className="space-y-3">
                  {courseNotes.map((n) => (
                    <div key={n.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <span className="text-sm font-semibold text-gray-900 capitalize">{fmtDate(n.lesson_date)}</span>
                        <button
                          onClick={() => remove(n.id)}
                          disabled={deletingId === n.id}
                          className="text-xs text-gray-300 hover:text-red-500 disabled:opacity-50 shrink-0"
                        >
                          {deletingId === n.id ? "Tar bort..." : "Ta bort"}
                        </button>
                      </div>
                      <div className="space-y-3">
                        {n.summary && (
                          <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Vad ni gjorde</p>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{n.summary}</p>
                          </div>
                        )}
                        {n.homework && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#7B3FB0" }}>Läxa</p>
                            <p className="text-sm text-gray-700 whitespace-pre-line">{n.homework}</p>
                          </div>
                        )}
                        {n.notes && (
                          <div className="bg-gray-50 rounded-lg px-3 py-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Intern anteckning</p>
                            <p className="text-sm text-gray-600 whitespace-pre-line">{n.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
