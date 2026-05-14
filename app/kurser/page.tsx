"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

type CourseData = {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
  price_sek: number;
  duration_weeks: number | null;
  sessions_per_week: number;
  max_participants: number | null;
  enrolled_count: number;
  weekly_schedule: Array<{ enabled: boolean; time: string }> | null;
};

const DAY_NAMES_FULL = ["Måndagar", "Tisdagar", "Onsdagar", "Torsdagar", "Fredagar", "Lördagar", "Söndagar"];

function formatSchedule(sched: CourseData["weekly_schedule"]): string | null {
  if (!Array.isArray(sched)) return null;
  const enabled = sched
    .map((d, i) => (d?.enabled ? { day: DAY_NAMES_FULL[i], time: d.time } : null))
    .filter((x): x is { day: string; time: string } => x !== null);
  if (enabled.length === 0) return null;
  // Gruppera dagar med samma tid: "Måndagar & Torsdagar 18:00"
  const byTime = new Map<string, string[]>();
  for (const { day, time } of enabled) {
    if (!byTime.has(time)) byTime.set(time, []);
    byTime.get(time)!.push(day);
  }
  return Array.from(byTime.entries())
    .map(([time, days]) => `${days.join(" & ")} kl. ${time}`)
    .join(" · ");
}

type WaitlistForm = {
  name: string;
  email: string;
  phone: string;
  level_description: string;
};

type ApplicationForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  postal_code: string;
  city: string;
  experience: string;
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Nybörjare",
  intermediate: "Mellannivå",
  advanced: "Avancerad",
};

const faqs = [
  { q: "Hur sker undervisningen?", a: "All undervisning sker online via videosamtal (Google Meet eller Zoom). Du behöver bara en dator, surfplatta eller telefon med kamera och mikrofon." },
  { q: "Vad händer om jag missar en lektion?", a: "Om man missar en lektion kan man ta del av det man har missat via elevsidan." },
  { q: "Vad händer om läraren måste ställa in en lektion?", a: "Läraren kommer försöka ersätta lektionen på annan tid." },
  { q: "Kan man ansöka till en fullsatt kurs?", a: "Ja, då hamnar man på en väntelista." },
  { q: "Är kurserna för alla åldrar?", a: "Ja, vi tar emot elever från 11 år och uppåt. Barn och unga undervisas med anpassad pedagogik." },
  { q: "Hur betalar jag?", a: "Betalning sker för 3 månader i taget i förväg. Vi fakturerar via Stripe och du kan betala med kort (Visa/Mastercard) eller Klarna." },
  { q: "Varför betalar man för 3 månader åt gången?", a: "Vi arbetar med 3-månadersperioder för att säkerställa engagemang och kontinuitet i studierna. Det ger också bättre förutsättningar för att nå resultat och upprätthålla en seriös och strukturerad nivå i undervisningen." },
  { q: "Vad händer om man vill avsluta sina studier innan 3 månader?", a: "Anmälan gäller för hela 3-månadersperioden och avgiften återbetalas inte vid avbrutna studier." },
];

function SpotsBar({ enrolled, max }: { enrolled: number; max: number | null }) {
  if (!max) return null;
  const pct  = Math.min((enrolled / max) * 100, 100);
  const left = max - enrolled;
  const full = left <= 0;
  const low  = left > 0 && left <= 3;

  return (
    <div className="mb-5">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-500">{enrolled} av {max} platser bokade</span>
        <span className={`font-semibold ${full ? "text-red-500" : low ? "text-amber-500" : "text-green-600"}`}>
          {full ? "Fullbokad" : low ? `Bara ${left} platser kvar!` : `${left} platser lediga`}
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: full ? "#EF4444" : low ? "#F59E0B" : "#7B3FB0" }} />
      </div>
    </div>
  );
}

function ApplyButton({ course, enrolledIds, appliedIds, onApply, onWaitlist }: {
  course: CourseData;
  enrolledIds: Set<string>;
  appliedIds: Set<string>;
  onApply: (course: CourseData) => void;
  onWaitlist: (course: CourseData) => void;
}) {
  const isFull     = course.max_participants !== null && course.enrolled_count >= course.max_participants;
  const isEnrolled = enrolledIds.has(course.id);
  const hasApplied = appliedIds.has(course.id);

  if (isEnrolled) {
    return <div className="w-full text-center font-semibold py-3 rounded-xl bg-green-50 text-green-600 text-sm">✓ Godkänd & anmäld</div>;
  }
  if (hasApplied) {
    return <div className="w-full text-center font-semibold py-3 rounded-xl bg-purple-50 text-sm" style={{ color: "#7B3FB0" }}>✓ Ansökan skickad – väntar på svar</div>;
  }
  if (isFull) {
    return (
      <button onClick={() => onWaitlist(course)}
        className="block w-full text-center font-semibold py-3 rounded-xl border-2 transition-all hover:bg-amber-50"
        style={{ borderColor: "#F59E0B", color: "#B45309" }}>
        Lägg mig i kö
      </button>
    );
  }
  return (
    <button onClick={() => onApply(course)}
      className="block w-full text-center font-semibold py-3 rounded-xl transition-all active:scale-95 hover:opacity-90"
      style={{ backgroundColor: "#7B3FB0", color: "white" }}>
      Ansök nu
    </button>
  );
}

const emptyWaitlist: WaitlistForm    = { name: "", email: "", phone: "", level_description: "" };
const emptyApplication: ApplicationForm = { name: "", email: "", phone: "", address: "", postal_code: "", city: "", experience: "" };

export default function Kurser() {
  const [courses, setCourses]         = useState<CourseData[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [appliedIds, setAppliedIds]   = useState<Set<string>>(new Set());
  const [loading, setLoading]         = useState(true);
  const [openFaq, setOpenFaq]         = useState<number | null>(null);
  const [toast, setToast]             = useState("");

  // Application modal
  const [applyCourse, setApplyCourse]   = useState<CourseData | null>(null);
  const [appForm, setAppForm]           = useState<ApplicationForm>(emptyApplication);
  const [appLoading, setAppLoading]     = useState(false);
  const [appDone, setAppDone]           = useState(false);

  // Waitlist modal
  const [waitlistCourse, setWaitlistCourse] = useState<CourseData | null>(null);
  const [wForm, setWForm]                   = useState<WaitlistForm>(emptyWaitlist);
  const [wLoading, setWLoading]             = useState(false);
  const [wDone, setWDone]                   = useState(false);

  // Lås bakgrundsscroll när en modal är öppen
  useEffect(() => {
    if (applyCourse || waitlistCourse) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = original; };
    }
  }, [applyCourse, waitlistCourse]);

  useEffect(() => {
    (async () => {
      const [coursesRes, supabase] = await Promise.all([
        fetch("/api/courses").then((r) => r.json()),
        Promise.resolve(createClient()),
      ]);
      setCourses(Array.isArray(coursesRes) ? coursesRes : []);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: enr } = await supabase
          .from("enrollments").select("course_id")
          .eq("student_id", user.id).neq("payment_status", "cancelled");
        setEnrolledIds(new Set((enr ?? []).map((e) => e.course_id)));
      }
      setLoading(false);
    })();
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 4000); };

  const openApply = (course: CourseData) => {
    setApplyCourse(course);
    setAppForm(emptyApplication);
    setAppDone(false);
  };

  const submitApplication = async () => {
    if (!applyCourse) return;
    if (!appForm.name || !appForm.email || !appForm.phone || !appForm.address || !appForm.postal_code || !appForm.city) {
      showToast("Fyll i alla obligatoriska fält (*).");
      return;
    }
    setAppLoading(true);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: applyCourse.id, ...appForm }),
    });
    const data = await res.json();
    setAppLoading(false);
    if (res.ok) {
      setAppDone(true);
      setAppliedIds((prev) => new Set([...prev, applyCourse.id]));
    } else {
      showToast(data.error ?? "Något gick fel.");
    }
  };

  const openWaitlist = (course: CourseData) => {
    setWaitlistCourse(course);
    setWForm(emptyWaitlist);
    setWDone(false);
  };

  const submitWaitlist = async () => {
    if (!waitlistCourse) return;
    if (!wForm.name || !wForm.email || !wForm.phone) {
      showToast("Fyll i namn, e-post och telefon.");
      return;
    }
    setWLoading(true);
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: waitlistCourse.id, ...wForm }),
    });
    const data = await res.json();
    setWLoading(false);
    if (res.ok) {
      setWDone(true);
    } else {
      showToast(data.error ?? "Något gick fel.");
    }
  };

  return (
    <>
      <Navbar />
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#7B3FB0] text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg max-w-sm">
          {toast}
        </div>
      )}

      {/* Application Modal */}
      {applyCourse && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setApplyCourse(null); }}
        >
          <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col my-4 max-h-[calc(100vh-2rem)] overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-3 shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Ansök – {applyCourse.title}</h2>
                  <p className="text-sm text-gray-400 mt-1">Fyll i dina uppgifter så granskar läraren din ansökan.</p>
                </div>
                <button
                  onClick={() => setApplyCourse(null)}
                  aria-label="Stäng"
                  className="text-gray-400 hover:text-gray-600 -mr-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

            {appDone ? (
              <div className="px-6 py-10 text-center overflow-y-auto">
                <div className="text-4xl mb-3">🎉</div>
                <p className="font-semibold text-gray-900 mb-1">Ansökan skickad!</p>
                <p className="text-sm text-gray-400 mb-2">Du får svar via e-post när läraren granskat din ansökan.</p>
                <p className="text-xs text-gray-400 mb-6">Vid godkännande faktureras <strong>3 månader i förväg</strong> ({((applyCourse.price_sek * 3) / 100).toLocaleString("sv-SE")} kr).</p>
                <button onClick={() => setApplyCourse(null)} className="text-sm text-gray-400 hover:text-gray-600 underline">Stäng</button>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4 overflow-y-auto">
                {/* Payment info banner */}
                <div className="rounded-xl p-4 text-sm" style={{ backgroundColor: "#F5EEFF" }}>
                  <p className="font-semibold mb-1" style={{ color: "#7B3FB0" }}>Betalningsinformation</p>
                  <p className="text-gray-600">Vid godkänd ansökan faktureras <strong>3 månader i förväg</strong> ({((applyCourse.price_sek * 3) / 100).toLocaleString("sv-SE")} kr = {applyCourse.sessions_per_week * 12} lektioner).</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Namn *</label>
                  <input value={appForm.name} onChange={(e) => setAppForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0]/30"
                    placeholder="Ditt fullständiga namn" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">E-post *</label>
                  <input type="email" value={appForm.email} onChange={(e) => setAppForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0]/30"
                    placeholder="din@email.se" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Telefonnummer *</label>
                  <input type="tel" value={appForm.phone} onChange={(e) => setAppForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0]/30"
                    placeholder="070-123 45 67" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Gatuadress *</label>
                  <input value={appForm.address} onChange={(e) => setAppForm(p => ({ ...p, address: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0]/30"
                    placeholder="Storgatan 1" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Postnummer *</label>
                    <input value={appForm.postal_code} onChange={(e) => setAppForm(p => ({ ...p, postal_code: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0]/30"
                      placeholder="123 45" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Ort *</label>
                    <input value={appForm.city} onChange={(e) => setAppForm(p => ({ ...p, city: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0]/30"
                      placeholder="Stockholm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Beskriv din erfarenhet av Koranen</label>
                  <textarea value={appForm.experience} onChange={(e) => setAppForm(p => ({ ...p, experience: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0]/30 resize-none"
                    rows={3} placeholder="T.ex. Jag är nybörjare, kan läsa lite arabiska men aldrig läst Koranen..." />
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => setApplyCourse(null)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">
                    Avbryt
                  </button>
                  <button onClick={submitApplication} disabled={appLoading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 hover:opacity-90"
                    style={{ backgroundColor: "#7B3FB0" }}>
                    {appLoading ? "Skickar..." : "Skicka ansökan"}
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Waitlist Modal */}
      {waitlistCourse && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setWaitlistCourse(null); }}
        >
          <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col my-4 max-h-[calc(100vh-2rem)] overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-3 shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Anmäl intresse – {waitlistCourse.title}</h2>
                  <p className="text-sm text-gray-400 mt-1">Kursen är fullbokad. Fyll i formuläret så kontaktar vi dig om en plats öppnas.</p>
                </div>
                <button
                  onClick={() => setWaitlistCourse(null)}
                  aria-label="Stäng"
                  className="text-gray-400 hover:text-gray-600 -mr-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

            {wDone ? (
              <div className="px-6 py-10 text-center overflow-y-auto">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-semibold text-gray-900 mb-1">Du är tillagd i kön!</p>
                <p className="text-sm text-gray-400 mb-6">Vi hör av oss via e-post eller telefon när en plats öppnas.</p>
                <button onClick={() => setWaitlistCourse(null)} className="text-sm text-gray-400 hover:text-gray-600 underline">Stäng</button>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Namn *</label>
                  <input
                    value={wForm.name}
                    onChange={(e) => setWForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0]/30"
                    placeholder="Ditt fullständiga namn"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">E-post *</label>
                  <input
                    type="email"
                    value={wForm.email}
                    onChange={(e) => setWForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0]/30"
                    placeholder="din@email.se"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Telefonnummer *</label>
                  <input
                    type="tel"
                    value={wForm.phone}
                    onChange={(e) => setWForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0]/30"
                    placeholder="070-123 45 67"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Beskriv din nivå</label>
                  <textarea
                    value={wForm.level_description}
                    onChange={(e) => setWForm(p => ({ ...p, level_description: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0]/30 resize-none"
                    rows={3}
                    placeholder="T.ex. jag är nybörjare, kan läsa lite arabiska men aldrig läst Koranen..."
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setWaitlistCourse(null)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50"
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={submitWaitlist}
                    disabled={wLoading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                    style={{ backgroundColor: "#F59E0B" }}
                  >
                    {wLoading ? "Skickar..." : "Anmäl intresse"}
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        {/* Hero */}
        <section className="py-20" style={{ background: "linear-gradient(135deg, #1A1520 0%, #2E1A47 100%)" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">Kurser & Priser</h1>
            <p className="text-white/70 text-lg">Välj den kurs som passar din nivå och börja din koranresa idag.</p>
          </div>
        </section>

        {/* Kurskort */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 h-96 animate-pulse" />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center text-gray-400 py-20">Inga aktiva kurser just nu. Kom tillbaka snart!</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                {courses.map((course, idx) => {
                  const isFull    = course.max_participants !== null && course.enrolled_count >= course.max_participants;
                  const isPopular = idx === Math.floor(courses.length / 2);
                  return (
                    <div key={course.id}
                      className={`relative rounded-2xl overflow-hidden border transition-shadow hover:shadow-lg ${
                        isPopular ? "border-[#7B3FB0] shadow-md" : "border-gray-200 bg-white shadow-sm"
                      }`}
                    >
                      {isPopular && (
                        <div className="text-center py-2 text-sm font-semibold text-white" style={{ backgroundColor: "#7B3FB0" }}>
                          Populärast
                        </div>
                      )}
                      {isFull && (
                        <div className="text-center py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: "#F59E0B" }}>
                          Fullbokad – Anmäl intresse
                        </div>
                      )}
                      <div className="p-8 bg-white">
                        <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                          style={{ backgroundColor: "#F5EEFF", color: "#7B3FB0" }}>
                          {course.level ? (LEVEL_LABELS[course.level] ?? course.level) : "Kurs"}
                        </span>

                        <h2 className="text-xl font-bold text-gray-900 mt-4 mb-2">{course.title}</h2>
                        {course.description && (
                          <ul className="text-gray-500 text-sm leading-relaxed mb-6 space-y-1.5">
                            {course.description
                              .split(/\s*-\s+/)
                              .map((s) => s.trim())
                              .filter(Boolean)
                              .map((item, i) => (
                                <li key={i} className="flex gap-2">
                                  <span className="shrink-0" style={{ color: "#7B3FB0" }}>•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                          </ul>
                        )}

                        <div className="flex items-end gap-1 mb-1">
                          <span className="text-4xl font-bold text-gray-900">{(course.price_sek / 100).toLocaleString("sv-SE")}</span>
                          <span className="text-gray-500 mb-1">kr/mån</span>
                        </div>
                        <div className="flex gap-3 text-xs text-gray-400 mb-3">
                          {course.duration_weeks && <span>{course.duration_weeks} veckor</span>}
                          {course.duration_weeks && <span>•</span>}
                          <span>{course.sessions_per_week} lekt/vecka</span>
                        </div>
                        {formatSchedule(course.weekly_schedule) && (
                          <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg" style={{ backgroundColor: "#F5EEFF" }}>
                            <svg className="w-4 h-4 shrink-0" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs font-medium" style={{ color: "#7B3FB0" }}>
                              {formatSchedule(course.weekly_schedule)}
                            </span>
                          </div>
                        )}

                        <SpotsBar enrolled={course.enrolled_count} max={course.max_participants} />

                        <ApplyButton
                          course={course}
                          enrolledIds={enrolledIds}
                          appliedIds={appliedIds}
                          onApply={openApply}
                          onWaitlist={openWaitlist}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-center text-sm text-gray-400 mt-8">
              Betalning sker säkert via Klarna (Visa/Mastercard & Swish). Fakturering per 3-månadersperiod i förväg.
            </p>
          </div>
        </section>


        {/* FAQ */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Vanliga frågor</h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button className="w-full flex items-center justify-between px-6 py-4 text-left" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span className="font-medium text-gray-900">{faq.q}</span>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
