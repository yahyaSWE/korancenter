"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Enrollment = {
  id: string;
  student: { id: string; full_name: string | null; email: string | null; created_at: string } | null;
  course: { id: string; title: string } | null;
};

type ProgressRow = {
  id: string;
  student_id: string;
  course_id: string;
  homework: string | null;
  last_lesson_summary: string | null;
  next_lesson_notes: string | null;
  updated_at: string;
  course: { id: string; title: string } | null;
};

type ProgressForm = {
  homework: string;
  last_lesson_summary: string;
  next_lesson_notes: string;
};

const emptyForm: ProgressForm = { homework: "", last_lesson_summary: "", next_lesson_notes: "" };

export default function ElevDetalj() {
  const params = useParams<{ id: string }>();
  const studentId = params.id;

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [forms, setForms] = useState<Record<string, ProgressForm>>({});
  const [savingCourseId, setSavingCourseId] = useState<string | null>(null);
  const [savedCourseId, setSavedCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [studentsRes, progRes] = await Promise.all([
      fetch("/api/teacher/students").then((r) => r.json()),
      fetch(`/api/teacher/students/${studentId}/progress`).then((r) => r.json()),
    ]);
    if (Array.isArray(studentsRes)) {
      setEnrollments(studentsRes.filter((e: Enrollment) => e.student?.id === studentId));
    }
    if (Array.isArray(progRes)) {
      setProgress(progRes);
      const initial: Record<string, ProgressForm> = {};
      for (const p of progRes as ProgressRow[]) {
        initial[p.course_id] = {
          homework: p.homework ?? "",
          last_lesson_summary: p.last_lesson_summary ?? "",
          next_lesson_notes: p.next_lesson_notes ?? "",
        };
      }
      setForms(initial);
    }
    setLoading(false);
  }, [studentId]);

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

  const setField = (courseId: string, field: keyof ProgressForm, value: string) => {
    setForms((prev) => ({
      ...prev,
      [courseId]: { ...(prev[courseId] ?? emptyForm), [field]: value },
    }));
  };

  const save = async (courseId: string) => {
    const form = forms[courseId] ?? emptyForm;
    setSavingCourseId(courseId);
    const res = await fetch(`/api/teacher/students/${studentId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: courseId, ...form }),
    });
    setSavingCourseId(null);
    if (res.ok) {
      const updated = await res.json();
      setProgress((prev) => {
        const idx = prev.findIndex((p) => p.course_id === courseId);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = updated;
          return copy;
        }
        return [...prev, updated];
      });
      setSavedCourseId(courseId);
      setTimeout(() => setSavedCourseId(null), 2000);
    }
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

      {/* Progress per course */}
      {courses.map((course) => {
        const form = forms[course.id] ?? emptyForm;
        const existing = progress.find((p) => p.course_id === course.id);
        const isSaving = savingCourseId === course.id;
        const isSaved = savedCourseId === course.id;
        return (
          <div key={course.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">{course.title}</h2>
                {existing?.updated_at && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Senast uppdaterad {new Date(existing.updated_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
              {isSaved && (
                <span className="text-xs font-medium px-2 py-1 rounded-lg bg-green-50 text-green-600">✓ Sparat</span>
              )}
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <svg className="w-4 h-4" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Var slutade vi senast?
                </label>
                <textarea
                  rows={2}
                  value={form.last_lesson_summary}
                  onChange={(e) => setField(course.id, "last_lesson_summary", e.target.value)}
                  placeholder="T.ex. Sura Al-Baqarah, vers 25–30. Tajwid-regel: madd lazim."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0] focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <svg className="w-4 h-4" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Läxa till nästa gång
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
                  Anteckningar inför nästa lektion
                </label>
                <textarea
                  rows={3}
                  value={form.next_lesson_notes}
                  onChange={(e) => setField(course.id, "next_lesson_notes", e.target.value)}
                  placeholder="T.ex. Eleven har svårt med ghunna. Repetera grunderna i nasalisering. Var extra tydlig med exempel."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0] focus:border-transparent resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => save(course.id)}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: "#7B3FB0" }}
                >
                  {isSaving ? "Sparar..." : "Spara"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
