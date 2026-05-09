"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Person = { id: string; full_name: string | null; email: string | null };

type MessageRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  sender: Person | null;
  recipient: Person | null;
};

type Conversation = {
  partner: Person;
  messages: MessageRow[];
  unreadCount: number;
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Igår";
  if (diffDays < 7) return d.toLocaleDateString("sv-SE", { weekday: "short" });
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
}

function fmtBubbleTime(iso: string) {
  return new Date(iso).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

function Avatar({ name, size = 9 }: { name: string; size?: number }) {
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-bold shrink-0`}
      style={{ backgroundColor: "#7B3FB0", fontSize: size <= 8 ? 11 : 13 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function Meddelanden() {
  const [myId, setMyId] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [teachers, setTeachers] = useState<Person[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNewMsg, setShowNewMsg] = useState(false);
  const [newMsgForm, setNewMsgForm] = useState({ recipient_id: "", subject: "", content: "" });
  const [showMobileThread, setShowMobileThread] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  const buildConversations = useCallback((msgs: MessageRow[], uid: string): Conversation[] => {
    const map = new Map<string, Conversation>();
    for (const msg of msgs) {
      const otherId = msg.sender_id === uid ? msg.recipient_id : msg.sender_id;
      const otherProfile = (msg.sender_id === uid ? msg.recipient : msg.sender) ?? { id: otherId, full_name: null, email: null };
      if (!map.has(otherId)) {
        map.set(otherId, { partner: otherProfile, messages: [], unreadCount: 0 });
      }
      const conv = map.get(otherId)!;
      conv.messages.push(msg);
      if (!msg.is_read && msg.recipient_id === uid) conv.unreadCount++;
    }
    // Sort messages within each conversation oldest → newest
    for (const conv of map.values()) {
      conv.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
    // Sort conversations newest last message first
    return Array.from(map.values()).sort((a, b) => {
      const aLast = a.messages[a.messages.length - 1].created_at;
      const bLast = b.messages[b.messages.length - 1].created_at;
      return new Date(bLast).getTime() - new Date(aLast).getTime();
    });
  }, []);

  const loadMessages = useCallback(async (uid: string) => {
    const res = await fetch("/api/portal/messages");
    const data = await res.json();
    if (!data.error) setConversations(buildConversations(data, uid));
  }, [buildConversations]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setMyId(user.id);

      // Hämta lärare från enrollments
      const { data: enrollData } = await supabase
        .from("enrollments")
        .select("course:courses!course_id(teacher_id, teacher:profiles!teacher_id(id, full_name, email))")
        .eq("payment_status", "paid");

      const teacherMap = new Map<string, Person>();
      for (const e of enrollData ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const t = ((e.course as any)?.teacher) as Person | null;
        if (t?.id) teacherMap.set(t.id, t);
      }
      setTeachers(Array.from(teacherMap.values()));

      await loadMessages(user.id);
      setLoading(false);
    });
  }, [loadMessages]);

  useEffect(() => { scrollToBottom(); }, [selectedPartnerId, scrollToBottom]);

  const selectedConv = conversations.find((c) => c.partner.id === selectedPartnerId) ?? null;
  const partnerName = (p: Person) => p.full_name ?? p.email ?? "Okänd";

  const selectConversation = async (conv: Conversation) => {
    setSelectedPartnerId(conv.partner.id);
    setShowMobileThread(true);
    scrollToBottom();

    // Markera olästa som lästa
    const unread = conv.messages.filter((m) => !m.is_read && m.recipient_id === myId);
    for (const msg of unread) {
      fetch("/api/portal/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: msg.id }),
      });
    }
    setConversations((prev) =>
      prev.map((c) =>
        c.partner.id === conv.partner.id
          ? { ...c, unreadCount: 0, messages: c.messages.map((m) => ({ ...m, is_read: true })) }
          : c
      )
    );
  };

  const sendReply = async () => {
    if (!selectedConv || !replyText.trim() || sending) return;
    setSending(true);
    const res = await fetch("/api/portal/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient_id: selectedConv.partner.id,
        content: replyText.trim(),
      }),
    });
    setSending(false);
    if (res.ok) {
      const newMsg: MessageRow = await res.json();
      setReplyText("");
      setConversations((prev) =>
        prev.map((c) =>
          c.partner.id === selectedConv.partner.id
            ? { ...c, messages: [...c.messages, newMsg] }
            : c
        )
      );
      scrollToBottom();
      replyRef.current?.focus();
    }
  };

  const sendNewMsg = async () => {
    if (!newMsgForm.recipient_id || !newMsgForm.content.trim() || sending) return;
    setSending(true);
    const res = await fetch("/api/portal/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMsgForm),
    });
    setSending(false);
    if (res.ok) {
      const newMsg: MessageRow = await res.json();
      setShowNewMsg(false);
      setNewMsgForm({ recipient_id: "", subject: "", content: "" });
      // Uppdatera konversationslistan
      setConversations((prev) => {
        const existing = prev.find((c) => c.partner.id === newMsg.recipient_id);
        if (existing) {
          return prev.map((c) =>
            c.partner.id === newMsg.recipient_id ? { ...c, messages: [...c.messages, newMsg] } : c
          );
        }
        const teacher = teachers.find((t) => t.id === newMsg.recipient_id);
        const newConv: Conversation = {
          partner: teacher ?? { id: newMsg.recipient_id, full_name: null, email: null },
          messages: [newMsg],
          unreadCount: 0,
        };
        return [newConv, ...prev];
      });
      setSelectedPartnerId(newMsg.recipient_id);
      setShowMobileThread(true);
      scrollToBottom();
    }
  };

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#7B3FB0", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col" style={{ height: "calc(100vh - 120px)", minHeight: 500 }}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Meddelanden
            {totalUnread > 0 && (
              <span className="ml-2 text-sm font-bold text-white px-2 py-0.5 rounded-full align-middle" style={{ backgroundColor: "#7B3FB0" }}>
                {totalUnread}
              </span>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Kommunikation med dina lärare.</p>
        </div>
        {teachers.length > 0 && (
          <button
            onClick={() => { setShowNewMsg(true); setNewMsgForm({ recipient_id: teachers[0].id, subject: "", content: "" }); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#7B3FB0" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nytt meddelande
          </button>
        )}
      </div>

      {/* Main panel */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex min-h-0">

        {/* ── Conversation list ── */}
        <div className={`w-full lg:w-72 xl:w-80 border-r border-gray-100 flex flex-col shrink-0 ${showMobileThread ? "hidden lg:flex" : "flex"}`}>
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Konversationer</p>
          </div>

          {conversations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#F5EEFF" }}>
                <svg className="w-7 h-7" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">Inga meddelanden ännu.</p>
              {teachers.length > 0 && (
                <button
                  onClick={() => { setShowNewMsg(true); setNewMsgForm({ recipient_id: teachers[0].id, subject: "", content: "" }); }}
                  className="text-sm font-medium px-4 py-2 rounded-xl mt-1"
                  style={{ backgroundColor: "#F5EEFF", color: "#7B3FB0" }}
                >
                  Skriv till din lärare
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {conversations.map((conv) => {
                const last = conv.messages[conv.messages.length - 1];
                const isSelected = conv.partner.id === selectedPartnerId;
                const sentByMe = last.sender_id === myId;
                return (
                  <button
                    key={conv.partner.id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors ${isSelected ? "bg-[#F5EEFF]" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <Avatar name={partnerName(conv.partner)} size={9} />
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: "#7B3FB0" }}>
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-sm truncate ${conv.unreadCount > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>
                            {partnerName(conv.partner)}
                          </p>
                          <p className="text-xs text-gray-400 shrink-0">{fmtTime(last.created_at)}</p>
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? "text-gray-600 font-medium" : "text-gray-400"}`}>
                          {sentByMe ? "Du: " : ""}{last.content}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Thread panel ── */}
        <div className={`flex-1 flex flex-col min-w-0 ${showMobileThread ? "flex" : "hidden lg:flex"}`}>
          {selectedConv ? (
            <>
              {/* Thread header */}
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3 shrink-0">
                <button
                  className="lg:hidden p-1.5 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100"
                  onClick={() => setShowMobileThread(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <Avatar name={partnerName(selectedConv.partner)} size={8} />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{partnerName(selectedConv.partner)}</p>
                  <p className="text-xs text-gray-400">Lärare</p>
                </div>
              </div>

              {/* Messages */}
              <div ref={threadRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {selectedConv.messages.map((msg, i) => {
                  const mine = msg.sender_id === myId;
                  const prevMsg = selectedConv.messages[i - 1];
                  const showDateSep = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
                  return (
                    <div key={msg.id}>
                      {showDateSep && (
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-gray-100" />
                          <p className="text-xs text-gray-400 shrink-0">
                            {new Date(msg.created_at).toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })}
                          </p>
                          <div className="flex-1 h-px bg-gray-100" />
                        </div>
                      )}
                      <div className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}>
                        {!mine && <Avatar name={partnerName(selectedConv.partner)} size={7} />}
                        <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                          {msg.subject && (
                            <p className={`text-xs font-medium px-1 ${mine ? "text-right" : "text-left"}`} style={{ color: "#7B3FB0" }}>
                              {msg.subject}
                            </p>
                          )}
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                              mine
                                ? "text-white rounded-br-sm"
                                : "text-gray-800 bg-gray-100 rounded-bl-sm"
                            }`}
                            style={mine ? { backgroundColor: "#7B3FB0" } : {}}
                          >
                            {msg.content}
                          </div>
                          <p className={`text-[10px] text-gray-400 px-1 ${mine ? "text-right" : "text-left"}`}>
                            {fmtBubbleTime(msg.created_at)}
                            {mine && msg.is_read && <span className="ml-1" style={{ color: "#7B3FB0" }}>✓</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply box */}
              <div className="px-4 py-3 border-t border-gray-100 shrink-0">
                <div className="flex items-end gap-2 bg-gray-50 rounded-2xl px-4 py-2 border border-gray-200 focus-within:border-[#7B3FB0] focus-within:ring-1 focus-within:ring-[#7B3FB0] transition-all">
                  <textarea
                    ref={replyRef}
                    rows={1}
                    value={replyText}
                    onChange={(e) => {
                      setReplyText(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendReply();
                      }
                    }}
                    placeholder={`Svara ${partnerName(selectedConv.partner)}…`}
                    className="flex-1 bg-transparent resize-none text-sm text-gray-800 placeholder-gray-400 focus:outline-none leading-relaxed"
                    style={{ maxHeight: 120 }}
                  />
                  <button
                    onClick={sendReply}
                    disabled={!replyText.trim() || sending}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:opacity-90 disabled:opacity-40 shrink-0 mb-0.5"
                    style={{ backgroundColor: "#7B3FB0" }}
                    title="Skicka (Enter)"
                  >
                    {sending ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 pl-1">Enter för att skicka · Shift+Enter för ny rad</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#F5EEFF" }}>
                  <svg className="w-8 h-8" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm font-medium">Välj en konversation</p>
                <p className="text-gray-400 text-xs mt-1">eller skriv ett nytt meddelande till din lärare</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Nytt meddelande-modal ── */}
      {showNewMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Nytt meddelande</h2>
              <button onClick={() => setShowNewMsg(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Till *</label>
                <select
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0]"
                  value={newMsgForm.recipient_id}
                  onChange={(e) => setNewMsgForm({ ...newMsgForm, recipient_id: e.target.value })}
                >
                  {teachers.length === 0 && <option value="">Ingen lärare tilldelad</option>}
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name ?? t.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ämne (valfritt)</label>
                <input
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0]"
                  value={newMsgForm.subject}
                  onChange={(e) => setNewMsgForm({ ...newMsgForm, subject: e.target.value })}
                  placeholder="T.ex. Fråga om lektionen"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meddelande *</label>
                <textarea
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0] resize-none"
                  rows={4}
                  value={newMsgForm.content}
                  onChange={(e) => setNewMsgForm({ ...newMsgForm, content: e.target.value })}
                  placeholder="Skriv ditt meddelande här…"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={sendNewMsg}
                  disabled={sending || !newMsgForm.recipient_id || !newMsgForm.content.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                  style={{ backgroundColor: "#7B3FB0" }}
                >
                  {sending ? "Skickar…" : "Skicka"}
                </button>
                <button
                  onClick={() => setShowNewMsg(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50"
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
