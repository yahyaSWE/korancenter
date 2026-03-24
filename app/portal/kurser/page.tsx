export default function MinaKurser() {
  const enrolledCourses = [
    {
      title: "Tajwid & flytande läsning",
      level: "Mellannivå",
      teacher: "Maryam Hassan",
      progress: 40,
      nextLesson: "Måndag 25 mars, 18:00",
      lessonsCompleted: 12,
      lessonsTotal: 30,
      status: "active",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Mina kurser</h1>
        <p className="text-gray-500 mt-1">Översikt över dina registrerade kurser.</p>
      </div>

      {enrolledCourses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#F5EEFF" }}>
            <svg className="w-8 h-8" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Inga kurser ännu</h3>
          <p className="text-gray-500 text-sm mb-6">Du är inte anmäld till någon kurs ännu.</p>
          <a href="/kurser" className="inline-flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-xl" style={{ backgroundColor: "#7B3FB0" }}>
            Se tillgängliga kurser
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {enrolledCourses.map((course) => (
            <div key={course.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "#F5EEFF", color: "#7B3FB0" }}>
                        {course.level}
                      </span>
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-600">
                        Aktiv
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">{course.title}</h2>
                    <p className="text-sm text-gray-500">Lärare: {course.teacher}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-500">Framsteg</span>
                    <span className="font-medium text-gray-900">{course.lessonsCompleted} / {course.lessonsTotal} lektioner</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${course.progress}%`, backgroundColor: "#7B3FB0" }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{course.progress}% slutfört</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Nästa lektion</p>
                    <p className="text-sm font-medium text-gray-700">{course.nextLesson}</p>
                  </div>
                  <a
                    href="#"
                    className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: "#7B3FB0" }}
                  >
                    Gå med i lektion
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
