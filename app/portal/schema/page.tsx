"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Lesson = {
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string | null;
  course: { title: string } | null;
};

const MONTH_NAMES = ["Januari","Februari","Mars","April","Maj","Juni","Juli","Augusti","September","Oktober","November","December"];
const DAY_SHORT   = ["Mån","Tis","Ons","Tor","Fre","Lör","Sön"];

function endTime(iso: string, mins: number) {
  const s = new Date(iso);
  const e = new Date(s.getTime() + mins * 60_000);
  const fmt = (d: Date) => d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
  return `${fmt(s)}–${fmt(e)}`;
}

function calendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  // ISO: Mon=0 … Sun=6
  const startOffset = (firstDay.getDay() + 6) % 7;
  const days: (number | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export default function Schema() {
  const router = useRouter();
  const [lessons, setLessons]         = useState<Lesson[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const today   = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/logga-in"); return; }

      const { data: enrollments } = await supabase
        .from("enrollments").select("course_id")
        .eq("student_id", user.id).eq("payment_status", "paid");

      const ids = enrollments?.map((e) => e.course_id) ?? [];
      if (ids.length === 0) { setLoading(false); return; }

      const { data } = await supabase
        .from("lessons")
        .select("*, course:courses(title)")
        .in("course_id", ids)
        .eq("is_cancelled", false)
        .order("scheduled_at", { ascending: true });

      setLessons((data ?? []) as Lesson[]);
      setLoading(false);
    })();
  }, [router]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null);
  };

  const lessonsInMonth = lessons.filter((l) => {
    const d = new Date(l.scheduled_at);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });

  const lessonsByDay: Record<number, Lesson[]> = {};
  for (const l of lessonsInMonth) {
    const day = new Date(l.scheduled_at).getDate();
    lessonsByDay[day] = [...(lessonsByDay[day] ?? []), l];
  }

  const days = calendarDays(viewYear, viewMonth);

  const selectedLessons = selectedDay ? (lessonsByDay[selectedDay] ?? []) : [];
  const todayDay   = today.getDate();
  const isThisMonth = today.getFullYear() === viewYear && today.getMonth() === viewMonth;

  const upcoming = lessons.filter((l) => new Date(l.scheduled_at) >= today).slice(0, 5);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Schema</h1>
        <p className="text-gray-500 mt-1">Dina lektioner visade i kalender.</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm animate-pulse">
          Laddar schema...
        </div>
      ) : (
        <>
          {/* Calendar card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Month navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <button onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="font-semibold text-gray-900">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
              <button onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-50">
              {DAY_SHORT.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {days.map((day, idx) => {
                const hasLesson = day !== null && !!lessonsByDay[day];
                const isToday   = isThisMonth && day === todayDay;
                const isSelected = day !== null && day === selectedDay;
                const isPast    = day !== null && new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                return (
                  <button
                    key={idx}
                    disabled={!day}
                    onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                    className={`
                      relative h-12 flex flex-col items-center justify-center text-sm transition-colors
                      ${!day ? "cursor-default" : "hover:bg-purple-50 cursor-pointer"}
                      ${isSelected ? "bg-purple-50" : ""}
                      ${idx % 7 !== 6 ? "border-r border-gray-50" : ""}
                      ${idx < days.length - 7 ? "border-b border-gray-50" : ""}
                    `}
                  >
                    {day && (
                      <>
                        <span className={`
                          w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium
                          ${isToday ? "text-white" : isSelected ? "text-[#7B3FB0]" : isPast ? "text-gray-300" : "text-gray-700"}
                        `}
                          style={isToday ? { backgroundColor: "#7B3FB0" } : {}}>
                          {day}
                        </span>
                        {hasLesson && (
                          <span className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: isToday ? "#C084FC" : "#7B3FB0" }} />
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="px-6 py-3 border-t border-gray-50 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "#7B3FB0" }} />
                <span className="text-xs text-gray-400">Lektion</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full inline-flex items-center justify-center text-white text-xs" style={{ backgroundColor: "#7B3FB0", fontSize: "10px" }}>
                  {todayDay}
                </span>
                <span className="text-xs text-gray-400">Idag</span>
              </div>
            </div>
          </div>

          {/* Selected day lessons */}
          {selectedDay && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">
                  {selectedDay} {MONTH_NAMES[viewMonth].toLowerCase()} {viewYear}
                </h3>
              </div>
              {selectedLessons.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-gray-400">Inga lektioner denna dag.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {selectedLessons.map((l) => (
                    <div key={l.id} className="px-6 py-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#F5EEFF" }}>
                        <svg className="w-5 h-5" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{l.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {endTime(l.scheduled_at, l.duration_minutes)} · {l.course?.title}
                        </p>
                      </div>
                      {l.meeting_link ? (
                        <a href={l.meeting_link} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white shrink-0"
                          style={{ backgroundColor: "#7B3FB0" }}>
                          Gå med
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300 shrink-0">Länk saknas</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upcoming lessons */}
          {upcoming.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Kommande lektioner</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {upcoming.map((l) => {
                  const d = new Date(l.scheduled_at);
                  const dayNum = d.getDate();
                  const mon   = MONTH_NAMES[d.getMonth()].slice(0, 3);
                  return (
                    <div key={l.id} className="px-6 py-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-col shrink-0" style={{ backgroundColor: "#F5EEFF" }}>
                        <span className="text-xs font-bold leading-none" style={{ color: "#7B3FB0" }}>{dayNum}</span>
                        <span className="text-xs leading-none mt-0.5" style={{ color: "#7B3FB0" }}>{mon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{l.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {DAY_SHORT[(d.getDay() + 6) % 7]} · {endTime(l.scheduled_at, l.duration_minutes)} · {l.course?.title}
                        </p>
                      </div>
                      {l.meeting_link ? (
                        <a href={l.meeting_link} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white shrink-0"
                          style={{ backgroundColor: "#7B3FB0" }}>
                          Gå med
                        </a>
                      ) : (
                        <button
                          onClick={() => {
                            const d = new Date(l.scheduled_at);
                            setViewYear(d.getFullYear());
                            setViewMonth(d.getMonth());
                            setSelectedDay(d.getDate());
                          }}
                          className="text-xs text-gray-400 hover:text-[#7B3FB0] shrink-0">
                          Visa i kalender
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {lessons.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="text-4xl mb-3">📅</div>
              <h3 className="font-semibold text-gray-900 mb-1">Inga lektioner inbokade</h3>
              <p className="text-gray-400 text-sm">Lektioner syns här när du är anmäld till en kurs.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
