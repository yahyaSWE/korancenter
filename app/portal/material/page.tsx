const materials = [
  { title: "Introduktion till tajwid – regler och övningar", type: "PDF", lesson: "Lektion 1", date: "10 mars", size: "2.4 MB", icon: "📄" },
  { title: "Makharig Al-Huruf – artikulationspunkter", type: "PDF", lesson: "Lektion 3", date: "15 mars", size: "1.8 MB", icon: "📄" },
  { title: "Övningsvideo: Nun sakin och tanwin", type: "Video", lesson: "Lektion 5", date: "18 mars", size: "45 MB", icon: "🎥" },
  { title: "Läsövningar: Sura Al-Fatiha", type: "PDF", lesson: "Lektion 7", date: "20 mars", size: "0.5 MB", icon: "📄" },
  { title: "Anteckningar: Madd-regler sammanfattning", type: "Anteckning", lesson: "Lektion 9", date: "22 mars", size: "–", icon: "📝" },
  { title: "Övningsvideo: Flytande läsning av sura Al-Baqara", type: "Video", lesson: "Lektion 11", date: "24 mars", size: "62 MB", icon: "🎥" },
];

const typeColors: Record<string, { bg: string; text: string }> = {
  PDF: { bg: "#FEF2F2", text: "#DC2626" },
  Video: { bg: "#EFF6FF", text: "#2563EB" },
  Anteckning: { bg: "#F0FDF4", text: "#16A34A" },
};

export default function Material() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Lektionsmaterial</h1>
        <p className="text-gray-500 mt-1">Filer, videos och anteckningar från dina lektioner.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">{materials.length} filer</p>
          <div className="flex gap-2">
            {["Alla", "PDF", "Video", "Anteckning"].map((filter) => (
              <button
                key={filter}
                className={`text-xs font-medium px-3 py-1 rounded-full transition-all ${
                  filter === "Alla"
                    ? "text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={filter === "Alla" ? { backgroundColor: "#7B3FB0" } : {}}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {materials.map((m, i) => {
            const colors = typeColors[m.type] ?? { bg: "#F5F5F5", text: "#666" };
            return (
              <div key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="text-2xl">{m.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.bg, color: colors.text }}>
                      {m.type}
                    </span>
                    <span className="text-xs text-gray-400">{m.lesson} · {m.date}</span>
                    {m.size !== "–" && <span className="text-xs text-gray-400">{m.size}</span>}
                  </div>
                </div>
                <button className="shrink-0 p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
