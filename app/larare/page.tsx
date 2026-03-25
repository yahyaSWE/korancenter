"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type StudentEnrollment = {
  id: string;
  student: { id: string; full_name: string | null; email: string | null } | null;
  course: { id: string; title: string } | null;
};

type MessageRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  sender: { id: string; full_name: string | null; email: string | null } | null;
  recipient: { id: string; full_name: string | null; email: string | null } | null;
};

export default function LarareDashboard() {
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/teacher/students").then((r) => r.json()),
      fetch("/api/teacher/messages").then((r) => r.json()),
    ]).then(([e, m]) => {
      if (!e.error) setEnrollments(e);
      if (!m.error) setMessages(m);
      setLoading(false);
    });
  }, []);

  const uniqueStudents = Array.from(
    new Map(enrollments.map((e) => [e.student?.id, e.student])).values()
  ).filter(Boolean);

  const unreadCount = messages.filter((m) => !m.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#7B3FB0", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Översikt</h1>
        <p className="text-gray-500 mt-1">Välkommen till din lärarportal.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-3xl font-bold text-gray-900">{uniqueStudents.length}</p>
          <p className="text-sm text-gray-500 mt-0.5">Elever totalt</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-3xl font-bold" style={{ color: unreadCount > 0 ? "#7B3FB0" : "#111827" }}>{unreadCount}</p>
          <p className="text-sm text-gray-500 mt-0.5">Olästa meddelanden</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/larare/elever" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#F5EEFF" }}>
            <svg className="w-6 h-6" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Mina elever</p>
            <p className="text-sm text-gray-500">{uniqueStudents.length} elever i dina kurser</p>
          </div>
        </Link>
        <Link href="/larare/meddelanden" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#F5EEFF" }}>
            <svg className="w-6 h-6" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Meddelanden</p>
            <p className="text-sm text-gray-500">{unreadCount > 0 ? `${unreadCount} olästa` : "Inga olästa"}</p>
          </div>
        </Link>
      </div>

      {/* Recent students */}
      {uniqueStudents.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Senaste elever</h2>
          <div className="space-y-3">
            {uniqueStudents.slice(0, 5).map((s) => (
              <div key={s!.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: "#7B3FB0" }}>
                  {(s!.full_name ?? s!.email ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{s!.full_name ?? "–"}</p>
                  <p className="text-xs text-gray-400">{s!.email}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {enrollments.filter((e) => e.student?.id === s!.id).map((e) => e.course?.title).join(", ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
