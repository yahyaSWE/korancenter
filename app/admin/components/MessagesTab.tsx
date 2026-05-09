import type { Profile } from "@/lib/supabase/types";
import type { MessageRow } from "./types";

type Props = {
  students: Profile[];
  messages: MessageRow[];
  onMessage: (s: Profile) => void;
};

export function MessagesTab({ students, messages, onMessage }: Props) {
  return (
    <div className="space-y-6">
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
              <button onClick={() => onMessage(s)} className="text-xs font-medium px-3 py-1.5 rounded-lg shrink-0" style={{ backgroundColor: "#F5EEFF", color: "#7B3FB0" }}>
                Skriv
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Alla meddelanden ({messages.length})</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {messages.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">Inga meddelanden ännu.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {messages.map((msg) => {
                const senderName = msg.sender?.full_name ?? msg.sender?.email ?? "–";
                const recipientName = msg.recipient?.full_name ?? msg.recipient?.email ?? "–";
                return (
                  <div key={msg.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5" style={{ backgroundColor: "#7B3FB0" }}>
                          {senderName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-900">{senderName}</span>
                            <span className="text-xs text-gray-400">→</span>
                            <span className="text-sm font-medium text-gray-700">{recipientName}</span>
                            {!msg.is_read && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">Oläst</span>
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
