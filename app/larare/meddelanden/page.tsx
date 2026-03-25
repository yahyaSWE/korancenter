"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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

type Student = {
  id: string;
  full_name: string | null;
  email: string | null;
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
  if (sameDay) return "Idag " + d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

export default function LarareMeddelanden() {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [myId, setMyId] = useState<string>("");
  const [selected, setSelected] = useState<MessageRow | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeForm, setComposeForm] = useState({ recipient_id: "", subject: "", content: "" });
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () =>
    fetch("/api/teacher/messages")
      .then((r) => r.json())
      .then((data) => { if (!data.error) setMessages(data); });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setMyId(user.id);
    });

    Promise.all([
      load(),
      fetch("/api/teacher/students").then((r) => r.json()),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ]).then(([, enrollments]: [void, any]) => {
      if (!enrollments.error && Array.isArray(enrollments)) {
        const map = new Map<string, Student>();
        for (const e of enrollments) {
          if (e.student && !map.has(e.student.id)) {
            map.set(e.student.id, e.student);
          }
        }
        setStudents(Array.from(map.values()));
      }
      setLoading(false);
    });
  }, []);

  const handleSelect = async (msg: MessageRow) => {
    setSelected(msg);
    if (!msg.is_read && msg.recipient_id === myId) {
      await fetch("/api/teacher/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: msg.id }),
      });
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, is_read: true } : m));
    }
  };

  const sendMsg = async () => {
    if (!composeForm.recipient_id || !composeForm.content) return;
    setSending(true);
    const res = await fetch("/api/teacher/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(composeForm),
    });
    setSending(false);
    if (res.ok) {
      setShowCompose(false);
      setComposeForm({ recipient_id: "", subject: "", content: "" });
      load();
    }
  };

  const unread = messages.filter((m) => !m.is_read && m.recipient_id === myId).length;

  const getOtherName = (msg: MessageRow) => {
    if (msg.sender_id === myId) {
      return msg.recipient?.full_name ?? msg.recipient?.email ?? "Okänd";
    }
    return msg.sender?.full_name ?? msg.sender?.email ?? "Okänd";
  };

  const isSentByMe = (msg: MessageRow) => msg.sender_id === myId;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#7B3FB0", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meddelanden</h1>
          <p className="text-gray-500 mt-1">Kommunikation med dina elever.</p>
        </div>
        <button
          onClick={() => { setShowCompose(true); setComposeForm({ recipient_id: "", subject: "", content: "" }); }}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90"
          style={{ backgroundColor: "#7B3FB0" }}
        >
          + Nytt meddelande
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ minHeight: 500 }}>
        <div className="grid grid-cols-1 lg:grid-cols-5" style={{ minHeight: 500 }}>
          {/* List */}
          <div className="lg:col-span-2 border-r border-gray-100 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Konversationer</p>
              {unread > 0 && (
                <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: "#7B3FB0" }}>
                  {unread} nya
                </span>
              )}
            </div>
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Inga meddelanden ännu.</div>
            ) : (
              <div className="divide-y divide-gray-50 overflow-y-auto">
                {messages.map((msg) => {
                  const sentByMe = isSentByMe(msg);
                  const isUnread = !msg.is_read && !sentByMe;
                  return (
                    <button
                      key={msg.id}
                      onClick={() => handleSelect(msg)}
                      className={`w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors ${selected?.id === msg.id ? "bg-[#F5EEFF]" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: sentByMe ? "#9CA3AF" : "#7B3FB0" }}>
                          {getOtherName(msg).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm truncate ${isUnread ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                              {sentByMe ? "→ " : ""}{getOtherName(msg)}
                            </p>
                            <p className="text-xs text-gray-400 shrink-0">{fmtDate(msg.created_at)}</p>
                          </div>
                          {msg.subject && (
                            <p className={`text-xs truncate mt-0.5 ${isUnread ? "font-medium text-gray-700" : "text-gray-500"}`}>
                              {msg.subject}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 truncate mt-0.5">{msg.content}</p>
                        </div>
                        {isUnread && (
                          <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: "#7B3FB0" }} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail */}
          <div className="lg:col-span-3 flex flex-col">
            {selected ? (
              <>
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">{selected.subject ?? "(Inget ämne)"}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: "#7B3FB0" }}>
                      {getOtherName(selected).charAt(0).toUpperCase()}
                    </div>
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">{isSentByMe(selected) ? "Till: " + getOtherName(selected) : "Från: " + getOtherName(selected)}</span>
                      {" · "}{fmtDate(selected.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex-1 px-6 py-5 overflow-y-auto">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{selected.content}</p>
                </div>
                {!isSentByMe(selected) && (
                  <div className="px-6 py-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setComposeForm({
                          recipient_id: selected.sender_id,
                          subject: selected.subject ? "SV: " + selected.subject : "",
                          content: "",
                        });
                        setShowCompose(true);
                      }}
                      className="text-sm font-medium px-4 py-2 rounded-xl"
                      style={{ backgroundColor: "#F5EEFF", color: "#7B3FB0" }}
                    >
                      Svara
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p className="text-sm">Välj ett meddelande</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compose modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Nytt meddelande</h2>
              <button onClick={() => setShowCompose(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Till *</label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0]"
                  value={composeForm.recipient_id}
                  onChange={(e) => setComposeForm({ ...composeForm, recipient_id: e.target.value })}
                >
                  <option value="">Välj elev...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name ?? s.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ämne</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0]"
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                  placeholder="T.ex. Feedback från lektionen"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meddelande *</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0]"
                  rows={5}
                  value={composeForm.content}
                  onChange={(e) => setComposeForm({ ...composeForm, content: e.target.value })}
                  placeholder="Skriv ditt meddelande här..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={sendMsg}
                  disabled={sending || !composeForm.recipient_id || !composeForm.content}
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "#7B3FB0" }}
                >
                  {sending ? "Skickar..." : "Skicka"}
                </button>
                <button
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50"
                >
                  Avbryt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
