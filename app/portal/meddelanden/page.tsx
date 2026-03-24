"use client";

import { useState, useEffect } from "react";
import type { Message, Profile } from "@/lib/supabase/types";

type MessageWithSender = Message & { sender: Pick<Profile, "id" | "full_name" | "email"> | null };

export default function Meddelanden() {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [selected, setSelected] = useState<MessageWithSender | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/messages")
      .then((r) => r.json())
      .then((data) => { setMessages(data); setLoading(false); });
  }, []);

  const handleSelect = async (msg: MessageWithSender) => {
    setSelected(msg);
    if (!msg.is_read) {
      await fetch("/api/portal/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: msg.id }),
      });
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, is_read: true } : m));
    }
  };

  const unread = messages.filter((m) => !m.is_read).length;

  const senderName = (msg: MessageWithSender) =>
    msg.sender?.full_name ?? msg.sender?.email ?? "Okänd";

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const diff = today.getDate() - d.getDate();
    if (diff === 0 && today.getMonth() === d.getMonth()) return "Idag " + d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
    if (diff === 1) return "Igår";
    return d.toLocaleDateString("sv-SE");
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meddelanden</h1>
        <p className="text-gray-500 mt-1">Kommunikation med dina lärare och Korancenter.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ minHeight: 500 }}>
        <div className="grid grid-cols-1 lg:grid-cols-5" style={{ minHeight: 500 }}>
          {/* Lista */}
          <div className="lg:col-span-2 border-r border-gray-100 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Inkorg</p>
              {unread > 0 && (
                <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: "#7B3FB0" }}>
                  {unread} nya
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Laddar...</div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Inga meddelanden ännu.</div>
            ) : (
              <div className="divide-y divide-gray-50 overflow-y-auto">
                {messages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => handleSelect(msg)}
                    className={`w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors ${selected?.id === msg.id ? "bg-[#F5EEFF]" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: "#7B3FB0" }}>
                        {senderName(msg).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm truncate ${!msg.is_read ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                            {senderName(msg)}
                          </p>
                          <p className="text-xs text-gray-400 shrink-0">{fmtDate(msg.created_at)}</p>
                        </div>
                        {msg.subject && (
                          <p className={`text-xs truncate mt-0.5 ${!msg.is_read ? "font-medium text-gray-700" : "text-gray-500"}`}>
                            {msg.subject}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 truncate mt-0.5 line-clamp-1">{msg.content}</p>
                      </div>
                      {!msg.is_read && (
                        <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: "#7B3FB0" }} />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Innehåll */}
          <div className="lg:col-span-3 flex flex-col">
            {selected ? (
              <>
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">{selected.subject ?? "(Inget ämne)"}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: "#7B3FB0" }}>
                      {senderName(selected).charAt(0).toUpperCase()}
                    </div>
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">{senderName(selected)}</span> · {fmtDate(selected.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex-1 px-6 py-5 overflow-y-auto">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{selected.content}</p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p className="text-sm">Välj ett meddelande för att läsa det</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
