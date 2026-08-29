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
                { step: "2", title: "Anmäl dig & betala", desc: "Registrera dig och betala säkert via Stripe med kort eller Klarna." },
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

        {/* Elevportal */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4" style={{ backgroundColor: "#F5EEFF", color: "#7B3FB0" }}>
                  Elevportal
                </span>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Allt på ett ställe i din elevportal</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                  Som elev hos oss får du tillgång till en personlig portal där du har koll på allt som rör din koranresa.
                </p>
                <ul className="space-y-4">
                  {[
                    { title: "Direkt tillgång till lektionsrummet", desc: "Ett klick och du är inne på Microsoft Teams-mötet — samma länk för alla lektioner." },
                    { title: "Se din läxa och var du slutade senast", desc: "Läraren skriver in vad du ska göra till nästa gång så du alltid vet vad som väntar." },
                    { title: "Kommunicera med din lärare", desc: "Skicka meddelanden direkt i portalen — inget mejlbollande." },
                    { title: "Koll på betalningar och prenumeration", desc: "Se nästa fakturadatum och avsluta när du vill — direkt från portalen." },
                  ].map((feature) => (
                    <li key={feature.title} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: "#7B3FB0" }}>
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{feature.title}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{feature.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/logga-in"
                  className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#7B3FB0" }}
                >
                  Gå till elevportalen
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
              <div className="relative">
                <div className="rounded-3xl p-8 shadow-xl" style={{ background: "linear-gradient(135deg, #5C2D8A 0%, #7B3FB0 100%)" }}>
                  <div className="bg-white rounded-2xl p-5 mb-4 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#F5EEFF" }}>
                        <svg className="w-5 h-5" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Lektionsrum</p>
                        <p className="font-semibold text-gray-900 text-sm">Nybörjarkurs</p>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-white px-4 py-2.5 rounded-lg text-center" style={{ backgroundColor: "#7B3FB0" }}>
                      Gå till lektion →
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-lg">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Din läxa</p>
                    <p className="text-sm text-gray-800 mb-3">Memorera vers 31–35. Öva uttal av qalqalah-bokstäverna.</p>
                    <p className="text-xs text-gray-400">Var slutade vi: Sura Al-Baqarah, vers 25–30</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Vanliga frågor */}
        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Vanliga frågor</h2>
            <div className="space-y-3">
              {[
                { q: "Hur sker undervisningen?", a: "All undervisning sker online via videosamtal. Du behöver bara en dator, surfplatta eller telefon med kamera och mikrofon." },
                { q: "Vad händer om jag missar en lektion?", a: "Om man missar en lektion kan man ta del av det man har missat via elevportalen." },
                { q: "Vad händer om läraren måste ställa in en lektion?", a: "Läraren kommer försöka ersätta lektionen på annan tid." },
                { q: "Kan man ansöka till en fullsatt kurs?", a: "Ja. Ansökan visas som väntande hos läraren, som kan utöka gruppen med en plats eller hänvisa dig till en annan passande grupp." },
                { q: "Är kurserna för alla åldrar?", a: "Ja, vi tar emot elever från 11 år och uppåt. Barn och unga undervisas med anpassad pedagogik." },
                { q: "Hur betalar jag?", a: "Betalning sker för 3 månader i taget i förväg. Vi fakturerar via Stripe och du kan betala med kort eller Klarna." },
              ].map((faq, i) => (
                <details key={i} className="group bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                  <summary className="px-5 py-4 cursor-pointer font-semibold text-gray-900 flex items-center justify-between list-none">
                    {faq.q}
                    <svg className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="px-5 pb-4 text-gray-500 text-sm leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/kurser#faq" className="text-sm font-medium hover:underline" style={{ color: "#7B3FB0" }}>
                Se alla frågor →
              </Link>
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
