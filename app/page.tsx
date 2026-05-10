import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

async function getStats() {
  try {
    const supabase = await createClient();
    const [{ count: students }, { count: teachers }, { count: courses }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
      supabase.from("courses").select("*", { count: "exact", head: true }).eq("is_active", true),
    ]);
    return {
      students: students ?? 0,
      teachers: teachers ?? 0,
      courses: courses ?? 0,
    };
  } catch {
    return { students: 0, teachers: 0, courses: 0 };
  }
}

export default async function Home() {
  const stats = await getStats();

  const courseLabel = stats.courses > 0 ? String(stats.courses) : "3";

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section
          className="relative min-h-[90vh] flex items-center overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1A1520 0%, #2E1A47 60%, #7B3FB0 100%)" }}
        >
          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm text-white/90 font-medium">Anmälan öppen</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Lär dig läsa och memorera{" "}
                <span style={{ color: "#C49BD3" }}>Koranen</span>
              </h1>
              <p className="text-lg text-white/75 leading-relaxed mb-8 max-w-xl">
                Professionell koranundervisning online för kvinnor – av utbildade, kvinnliga lärare. Välj din kurs
                och börja din resa mot Koranen i dag.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/kurser"
                  className="inline-flex items-center justify-center gap-2 text-base font-semibold text-white px-7 py-3.5 rounded-xl transition-all hover:opacity-90 active:scale-95 shadow-lg"
                  style={{ backgroundColor: "#7B3FB0" }}
                >
                  Se kurser & priser
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="/om-oss"
                  className="inline-flex items-center justify-center gap-2 text-base font-medium text-white px-7 py-3.5 rounded-xl border border-white/30 hover:bg-white/10 transition-all"
                >
                  Om oss
                </Link>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 80H1440V40C1200 0 960 80 720 40C480 0 240 80 0 40V80Z" fill="white" />
            </svg>
          </div>
        </section>

        {/* Stats */}
        <section className="py-14 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center items-start gap-12 sm:gap-16 text-center">
              {[
                { value: "500+", label: "Nöjda elever" },
                { value: "4", label: "Erfarna lärare" },
                { value: courseLabel, label: "Aktiva kurser" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl font-bold" style={{ color: "#7B3FB0" }}>{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Vad vi erbjuder */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Vad vi erbjuder</h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Allt du behöver för att lära dig Koranen på ett tryggt och professionellt sätt – helt online.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  ),
                  title: "Koranläsning",
                  desc: "Lär dig korrekt uttal (tajwid) och flytande läsning av Koranen – från grunden eller på avancerad nivå.",
                },
                {
                  icon: (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  ),
                  title: "Memorering (Hifz)",
                  desc: "Strukturerat program för att memorera Koranen med individuellt anpassad takt och stöd från läraren.",
                },
                {
                  icon: (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  ),
                  title: "Kvinnliga lärare",
                  desc: "Undervisning i en trygg miljö av utbildade och erfarna kvinnliga lärare – helt online.",
                },
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: "#F5EEFF", color: "#7B3FB0" }}>
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hur det fungerar */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Hur det fungerar</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Tre enkla steg för att komma igång.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { step: "1", title: "Välj din kurs", desc: "Bläddra bland våra kurser och välj den nivå som passar dig bäst." },
                { step: "2", title: "Anmäl dig & betala", desc: "Registrera dig och betala säkert med Klarna – kort eller Swish." },
                { step: "3", title: "Börja lära dig", desc: "Logga in i elevportalen och påbörja din koranresa med din lärare." },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white mb-5 shadow-md" style={{ backgroundColor: "#7B3FB0" }}>
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20" style={{ background: "linear-gradient(135deg, #5C2D8A 0%, #7B3FB0 100%)" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Redo att börja din koranresa?</h2>
            <p className="text-white/75 mb-8 text-lg">Anmäl dig i dag och ta det första steget mot att lära dig Koranen.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/kurser" className="inline-flex items-center justify-center bg-white font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-all active:scale-95" style={{ color: "#7B3FB0" }}>
                Se alla kurser
              </Link>
              <Link href="/kontakt" className="inline-flex items-center justify-center border-2 border-white/40 text-white font-medium px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all">
                Kontakta oss
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
