const lessons = [
  { date: "Måndag 25 mars 2026", time: "18:00–19:00", course: "Tajwid & flytande läsning", teacher: "Maryam Hassan", status: "upcoming" },
  { date: "Onsdag 27 mars 2026", time: "18:00–19:00", course: "Tajwid & flytande läsning", teacher: "Maryam Hassan", status: "upcoming" },
  { date: "Måndag 1 april 2026", time: "18:00–19:00", course: "Tajwid & flytande läsning", teacher: "Maryam Hassan", status: "upcoming" },
  { date: "Onsdag 3 april 2026", time: "18:00–19:00", course: "Tajwid & flytande läsning", teacher: "Maryam Hassan", status: "upcoming" },
  { date: "Måndag 18 mars 2026", time: "18:00–19:00", course: "Tajwid & flytande läsning", teacher: "Maryam Hassan", status: "completed" },
  { date: "Onsdag 20 mars 2026", time: "18:00–19:00", course: "Tajwid & flytande läsning", teacher: "Maryam Hassan", status: "completed" },
];

export default function Schema() {
  const upcoming = lessons.filter((l) => l.status === "upcoming");
  const completed = lessons.filter((l) => l.status === "completed");

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Schema</h1>
        <p className="text-gray-500 mt-1">Dina kommande och genomförda lektioner.</p>
      </div>

      {/* Kommande */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Kommande lektioner</h2>
        <div className="space-y-3">
          {upcoming.map((lesson, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "#F5EEFF" }}
              >
                <svg className="w-6 h-6" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{lesson.course}</p>
                <p className="text-xs text-gray-400">{lesson.date} · {lesson.time}</p>
                <p className="text-xs text-gray-400">{lesson.teacher}</p>
              </div>
              <a
                href="#"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "#7B3FB0" }}
              >
                Gå med
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Genomförda */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Genomförda lektioner</h2>
        <div className="space-y-3">
          {completed.map((lesson, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 opacity-70">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gray-100">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-700 text-sm">{lesson.course}</p>
                <p className="text-xs text-gray-400">{lesson.date} · {lesson.time}</p>
                <p className="text-xs text-gray-400">{lesson.teacher}</p>
              </div>
              <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500">
                Genomförd
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
