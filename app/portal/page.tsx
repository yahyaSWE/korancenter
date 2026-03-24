import Link from "next/link";

const upcomingLessons = [
  { date: "Måndag 25 mars", time: "18:00–19:00", course: "Tajwid & flytande läsning", teacher: "Maryam Hassan", link: "#" },
  { date: "Onsdag 27 mars", time: "18:00–19:00", course: "Tajwid & flytande läsning", teacher: "Maryam Hassan", link: "#" },
  { date: "Måndag 1 april", time: "18:00–19:00", course: "Tajwid & flytande läsning", teacher: "Maryam Hassan", link: "#" },
];

export default function PortalDashboard() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Hälsning */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Välkommen tillbaka! 👋</h1>
        <p className="text-gray-500 mt-1">Här är en översikt av dina kurser och kommande lektioner.</p>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Aktiva kurser", value: "1", icon: "📚" },
          { label: "Slutförda lektioner", value: "12", icon: "✅" },
          { label: "Kommande lektioner", value: "3", icon: "📅" },
          { label: "Olästa meddelanden", value: "2", icon: "💬" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kommande lektioner */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Kommande lektioner</h2>
            <Link href="/portal/schema" className="text-xs font-medium hover:underline" style={{ color: "#7B3FB0" }}>
              Se hela schemat →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingLessons.map((lesson, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#F5EEFF" }}>
                  <svg className="w-5 h-5" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{lesson.course}</p>
                  <p className="text-xs text-gray-400">{lesson.date} · {lesson.time} · {lesson.teacher}</p>
                </div>
                <a
                  href={lesson.link}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                  style={{ backgroundColor: "#F5EEFF", color: "#7B3FB0" }}
                >
                  Gå med
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Snabblänkar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Snabblänkar</h2>
            </div>
            <div className="p-4 space-y-2">
              {[
                { href: "/portal/kurser", label: "Mina kurser" },
                { href: "/portal/material", label: "Lektionsmaterial" },
                { href: "/portal/meddelanden", label: "Meddelanden" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                >
                  {link.label}
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Meddelande-preview */}
          <div
            className="rounded-2xl p-5 text-white"
            style={{ background: "linear-gradient(135deg, #5C2D8A 0%, #7B3FB0 100%)" }}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">
                MH
              </div>
              <div>
                <p className="text-xs text-white/70 mb-1">Maryam Hassan · Igår</p>
                <p className="text-sm text-white/90 leading-relaxed">
                  Bra jobbat på senaste lektionen! Kom ihåg att öva på sura Al-Mulk till nästa gång.
                </p>
              </div>
            </div>
            <Link href="/portal/meddelanden" className="mt-4 block text-xs text-white/70 hover:text-white">
              Se alla meddelanden →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
