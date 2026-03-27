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
};

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
  experience: string;
};

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Nybörjare",
  intermediate: "Mellannivå",
  advanced: "Avancerad",
};

const faqs = [
  { q: "Hur sker undervisningen?", a: "All undervisning sker online via videosamtal (Google Meet eller Zoom). Du behöver bara en dator, surfplatta eller telefon med kamera och mikrofon." },
  { q: "Vad händer om jag missar en lektion?", a: "Du kan avboka eller boka om lektioner med minst 24 timmars varsel utan extra kostnad. Vi försöker alltid hitta en tid som passar." },
  { q: "Är kurserna för alla åldrar?", a: "Ja, vi tar emot elever från 8 år och uppåt. Barn och unga undervisas med anpassad pedagogik." },
  { q: "Hur betalar jag?", a: "Vi använder Klarna som betaltjänst. Du kan betala med kort (Visa/Mastercard) eller Swish. Betalning sker månadsvis." },
  { q: "Kan jag prova innan jag anmäler mig?", a: "Ja! Vi erbjuder en gratis provlektion på 30 minuter. Kontakta oss via kontaktformuläret så bokar vi in en tid." },
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
const emptyApplication: ApplicationForm = { name: "", email: "", phone: "", experience: "" };

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
    if (!appForm.name || !appForm.email || !appForm.phone) {
      showToast("Fyll i namn, e-post och telefon.");
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Ansök – {applyCourse.title}</h2>
              <p className="text-sm text-gray-400 mt-1">Fyll i dina uppgifter så granskar läraren din ansökan.</p>
            </div>

            {appDone ? (
              <div className="px-6 py-10 text-center">
                <div className="text-4xl mb-3">🎉</div>
                <p className="font-semibold text-gray-900 mb-1">Ansökan skickad!</p>
                <p className="text-sm text-gray-400 mb-2">Du får svar via e-post när läraren granskat din ansökan.</p>
                <p className="text-xs text-gray-400 mb-6">Vid godkännande faktureras <strong>3 månader i förväg</strong> ({((applyCourse.price_sek * 3) / 100).toLocaleString("sv-SE")} kr).</p>
                <button onClick={() => setApplyCourse(null)} className="text-sm text-gray-400 hover:text-gray-600 underline">Stäng</button>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4">
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
      )}

      {/* Waitlist Modal */}
      {waitlistCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Anmäl intresse – {waitlistCourse.title}</h2>
              <p className="text-sm text-gray-400 mt-1">Kursen är fullbokad. Fyll i formuläret så kontaktar vi dig om en plats öppnas.</p>
            </div>

            {wDone ? (
              <div className="px-6 py-10 text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-semibold text-gray-900 mb-1">Du är tillagd i kön!</p>
                <p className="text-sm text-gray-400 mb-6">Vi hör av oss via e-post eller telefon när en plats öppnas.</p>
                <button onClick={() => setWaitlistCourse(null)} className="text-sm text-gray-400 hover:text-gray-600 underline">Stäng</button>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4">
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
      )}

      <main className="flex-1">
        {/* Hero */}
        <section className="py-20" style={{ background: "linear-gradient(135deg, #1A1520 0%, #2E1A47 100%)" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">Kurser & Priser</h1>
            <p className="text-white/70 text-lg">Välj den kurs som passar din nivå och börja din koranresa i dag.</p>
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
                          <p className="text-gray-500 text-sm leading-relaxed mb-6">{course.description}</p>
                        )}

                        <div className="flex items-end gap-1 mb-1">
                          <span className="text-4xl font-bold text-gray-900">{(course.price_sek / 100).toLocaleString("sv-SE")}</span>
                          <span className="text-gray-500 mb-1">kr/mån</span>
                        </div>
                        <div className="flex gap-3 text-xs text-gray-400 mb-6">
                          {course.duration_weeks && <span>{course.duration_weeks} veckor</span>}
                          {course.duration_weeks && <span>•</span>}
                          <span>{course.sessions_per_week} lekt/vecka</span>
                        </div>

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
              Betalning sker säkert via Klarna (Visa/Mastercard & Swish). Månadsvis betalning.
            </p>
          </div>
        </section>

        {/* Gratis provlektion */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl p-10 text-white text-center" style={{ background: "linear-gradient(135deg, #5C2D8A 0%, #7B3FB0 100%)" }}>
              <h2 className="text-2xl font-bold mb-3">Prova gratis – utan förpliktelse</h2>
              <p className="text-white/75 mb-6">Boka en kostnadsfri provlektion på 30 minuter och känn om vår undervisning passar dig.</p>
              <Link href="/kontakt" className="inline-flex items-center gap-2 bg-white font-semibold px-8 py-3 rounded-xl hover:bg-gray-50 transition-all" style={{ color: "#7B3FB0" }}>
                Boka provlektion
              </Link>
            </div>
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
