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

function ApplyButton({ course, enrolledIds, onApply }: {
  course: CourseData;
  enrolledIds: Set<string>;
  onApply: (id: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  const isFull    = course.max_participants !== null && course.enrolled_count >= course.max_participants;
  const isEnrolled = enrolledIds.has(course.id);

  if (isEnrolled || done) {
    return (
      <div className="w-full text-center font-semibold py-3 rounded-xl bg-green-50 text-green-600 text-sm">
        ✓ Anmälan mottagen
      </div>
    );
  }

  if (isFull) {
    return (
      <div className="w-full text-center font-semibold py-3 rounded-xl bg-gray-100 text-gray-400 text-sm cursor-not-allowed">
        Fullbokad
      </div>
    );
  }

  return (
    <button
      onClick={async () => {
        setLoading(true);
        await onApply(course.id);
        setDone(true);
        setLoading(false);
      }}
      disabled={loading}
      className="block w-full text-center font-semibold py-3 rounded-xl transition-all active:scale-95 hover:opacity-90 disabled:opacity-60"
      style={{ backgroundColor: "#7B3FB0", color: "white" }}
    >
      {loading ? "Skickar..." : "Ansök nu"}
    </button>
  );
}

export default function Kurser() {
  const [courses, setCourses]       = useState<CourseData[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [userId, setUserId]         = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);
  const [openFaq, setOpenFaq]       = useState<number | null>(null);
  const [toast, setToast]           = useState("");

  useEffect(() => {
    (async () => {
      const [coursesRes, supabase] = await Promise.all([
        fetch("/api/courses").then((r) => r.json()),
        Promise.resolve(createClient()),
      ]);
      setCourses(Array.isArray(coursesRes) ? coursesRes : []);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: enr } = await supabase
          .from("enrollments").select("course_id")
          .eq("student_id", user.id).neq("payment_status", "cancelled");
        setEnrolledIds(new Set((enr ?? []).map((e) => e.course_id)));
      }
      setLoading(false);
    })();
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 4000); };

  const handleApply = async (courseId: string) => {
    if (!userId) {
      window.location.href = `/logga-in?next=/kurser`;
      return;
    }
    const res = await fetch("/api/portal/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: courseId }),
    });
    const data = await res.json();
    if (res.ok) {
      setEnrolledIds((prev) => new Set([...prev, courseId]));
      showToast("Din ansökan är mottagen! Vi kontaktar dig snart.");
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
                  const isFull = course.max_participants !== null && course.enrolled_count >= course.max_participants;
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

                        {!isFull && !enrolledIds.has(course.id) && !userId && (
                          <p className="text-xs text-gray-400 text-center mb-3">
                            <Link href="/logga-in" className="underline hover:text-[#7B3FB0]">Logga in</Link> för att ansöka
                          </p>
                        )}

                        <ApplyButton course={course} enrolledIds={enrolledIds} onApply={handleApply} />
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
