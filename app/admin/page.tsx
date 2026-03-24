"use client";

import { useState } from "react";

const mockStudents = [
  { id: 1, name: "Fatima Svensson", email: "fatima@example.com", course: "Tajwid & flytande läsning", enrolled: "1 mars 2026", status: "active" },
  { id: 2, name: "Aisha Lindgren", email: "aisha@example.com", course: "Koranläsning för nybörjare", enrolled: "5 mars 2026", status: "active" },
  { id: 3, name: "Maryam Johansson", email: "maryam.j@example.com", course: "Memorering (Hifz)", enrolled: "10 mars 2026", status: "active" },
  { id: 4, name: "Zainab Eriksson", email: "zainab@example.com", course: "Koranläsning för nybörjare", enrolled: "15 mars 2026", status: "inactive" },
];

const stats = [
  { label: "Totalt elever", value: "87", change: "+5 denna månad" },
  { label: "Aktiva kurser", value: "3", change: "" },
  { label: "Intäkter (mars)", value: "41 200 kr", change: "+12%" },
  { label: "Kommande lektioner", value: "24", change: "denna vecka" },
];

export default function AdminPanel() {
  const [tab, setTab] = useState<"overview" | "students" | "courses">("overview");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Adminpanel</h1>
            <p className="text-xs text-gray-400">Korancenter – hantera elever och kurser</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: "#7B3FB0" }}>
              A
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
          {[
            { key: "overview", label: "Översikt" },
            { key: "students", label: "Elever" },
            { key: "courses", label: "Kurser" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Översikt */}
        {tab === "overview" && (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
                  {stat.change && <p className="text-xs text-green-600 mt-1">{stat.change}</p>}
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Senast anmälda elever</h2>
              <div className="space-y-3">
                {mockStudents.slice(0, 3).map((student) => (
                  <div key={student.id} className="flex items-center gap-4 py-2">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: "#7B3FB0" }}>
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-400">{student.course}</p>
                    </div>
                    <p className="text-xs text-gray-400">{student.enrolled}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Elever */}
        {tab === "students" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Alla elever ({mockStudents.length})</h2>
              <button
                className="text-sm font-semibold text-white px-4 py-2 rounded-xl hover:opacity-90 transition-all"
                style={{ backgroundColor: "#7B3FB0" }}
              >
                + Lägg till elev
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Elev</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Kurs</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Anmäld</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {mockStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: "#7B3FB0" }}>
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <p className="text-xs text-gray-400">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{student.course}</td>
                      <td className="px-6 py-4 text-gray-400">{student.enrolled}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                          student.status === "active"
                            ? "bg-green-50 text-green-600"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${student.status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
                          {student.status === "active" ? "Aktiv" : "Inaktiv"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                          Ta bort
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Kurser */}
        {tab === "courses" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Kurser</h2>
              <button
                className="text-sm font-semibold text-white px-4 py-2 rounded-xl hover:opacity-90 transition-all"
                style={{ backgroundColor: "#7B3FB0" }}
              >
                + Skapa kurs
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { title: "Koranläsning för nybörjare", students: 28, teacher: "Aisha Karimi", price: "499 kr/mån", status: "active" },
                { title: "Tajwid & flytande läsning", students: 41, teacher: "Maryam Hassan", price: "599 kr/mån", status: "active" },
                { title: "Memorering (Hifz)", students: 18, teacher: "Fatima Al-Rashid", price: "699 kr/mån", status: "active" },
              ].map((course) => (
                <div key={course.title} className="px-6 py-5 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{course.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{course.teacher} · {course.students} elever</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">{course.price}</p>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-600">Aktiv</span>
                  <button className="text-xs text-gray-400 hover:text-gray-700">Redigera</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
