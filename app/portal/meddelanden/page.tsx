"use client";

import { useState } from "react";

const messages = [
  {
    id: 1,
    from: "Maryam Hassan",
    initials: "MH",
    subject: "Bra jobbat på senaste lektionen!",
    preview: "Kom ihåg att öva på sura Al-Mulk till nästa gång.",
    body: "Assalamu alaikum!\n\nDu gjorde ett riktigt bra jobb under gårdagens lektion – din läsning av Al-Baqara har verkligen förbättrats märkbart.\n\nKom ihåg att öva på sura Al-Mulk tills nästa gång. Fokusera på madd-reglerna i vers 3 och 4.\n\nBararakallahu feeki!",
    date: "Igår, 20:14",
    read: false,
  },
  {
    id: 2,
    from: "Maryam Hassan",
    initials: "MH",
    subject: "Kommande lektion – påminnelse",
    preview: "Vår lektion är på måndag kl 18:00. Här är länken till mötet.",
    body: "Assalamu alaikum!\n\nBara en påminnelse om att vår lektion är på måndag den 25 mars klockan 18:00.\n\nHär är länken till Google Meet: [länk]\n\nHoppas du haft en bra vecka. Vi ses på måndag insha'Allah!",
    date: "22 mars",
    read: false,
  },
  {
    id: 3,
    from: "Korancenter",
    initials: "KC",
    subject: "Välkommen till Korancenter!",
    preview: "Vi är glada att ha dig som elev. Här hittar du all information du behöver.",
    body: "Assalamu alaikum!\n\nVälkommen till Korancenter! Vi är mycket glada att ha dig som elev.\n\nI din elevportal kan du:\n• Se ditt schema och kommande lektioner\n• Ladda ner lektionsmaterial\n• Kommunicera med din lärare\n\nTveka inte att höra av dig om du har frågor.\n\nMed vänliga hälsningar,\nKorancenter",
    date: "10 mars",
    read: true,
  },
];

export default function Meddelanden() {
  const [selected, setSelected] = useState<typeof messages[0] | null>(null);
  const [messageList, setMessageList] = useState(messages);

  const handleSelect = (msg: typeof messages[0]) => {
    setSelected(msg);
    setMessageList((prev) => prev.map((m) => m.id === msg.id ? { ...m, read: true } : m));
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meddelanden</h1>
        <p className="text-gray-500 mt-1">Kommunikation med dina lärare och Korancenter.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ minHeight: "500px" }}>
        <div className="grid grid-cols-1 lg:grid-cols-5 h-full" style={{ minHeight: "500px" }}>
          {/* Meddelandelista */}
          <div className="lg:col-span-2 border-r border-gray-100">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Inkorg ({messageList.filter(m => !m.read).length} olästa)</p>
            </div>
            <div className="divide-y divide-gray-50">
              {messageList.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => handleSelect(msg)}
                  className={`w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors ${
                    selected?.id === msg.id ? "bg-[#F5EEFF]" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: "#7B3FB0" }}
                    >
                      {msg.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${!msg.read ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                          {msg.from}
                        </p>
                        <p className="text-xs text-gray-400 shrink-0">{msg.date}</p>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${!msg.read ? "font-medium text-gray-700" : "text-gray-400"}`}>
                        {msg.subject}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{msg.preview}</p>
                    </div>
                    {!msg.read && (
                      <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ backgroundColor: "#7B3FB0" }} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Meddelandeinnehåll */}
          <div className="lg:col-span-3 flex flex-col">
            {selected ? (
              <>
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">{selected.subject}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: "#7B3FB0" }}>
                      {selected.initials}
                    </div>
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">{selected.from}</span> · {selected.date}
                    </p>
                  </div>
                </div>
                <div className="flex-1 px-6 py-5">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{selected.body}</p>
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
