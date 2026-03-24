"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const courses = [
  {
    id: "nybörjare",
    level: "Nybörjare",
    title: "Koranläsning för nybörjare",
    desc: "Perfekt för dig som inte kan arabiska bokstäver. Vi börjar från grunden med alfabet, vokaliseringstecken (harakat) och grundläggande tajwid-regler.",
    price: 499,
    duration: "3 månader",
    sessions: "2 lektioner/vecka",
    features: [
      "Arabiska bokstäver & uttal",
      "Grundläggande vokaliseringstecken",
      "Enkel tajwid",
      "Korta suror",
      "Lektionsmaterial i elevportalen",
      "Veckolig feedback från läraren",
    ],
    highlight: false,
  },
  {
    id: "mellannivå",
    level: "Mellannivå",
    title: "Tajwid & flytande läsning",
    desc: "För dig som kan läsa arabiska men vill förbättra ditt uttal och flyt. Vi fördjupar tajwid-reglerna och övar på längre avsnitt ur Koranen.",
    price: 599,
    duration: "3 månader",
    sessions: "2 lektioner/vecka",
    features: [
      "Fördjupade tajwid-regler",
      "Flytande koranläsning",
      "Korrekt makharig (artikulationspunkter)",
      "Longer suras & juz-träning",
      "Lektionsmaterial i elevportalen",
      "Individuell feedback & rättelse",
    ],
    highlight: true,
  },
  {
    id: "memorering",
    level: "Avancerad",
    title: "Memorering (Hifz)",
    desc: "Strukturerat program för dig som vill memorera Koranen. Läraren sätter upp en personlig plan och följer upp din memorering kontinuerligt.",
    price: 699,
    duration: "Löpande",
    sessions: "3 lektioner/vecka",
    features: [
      "Personlig memoreringsplan",
      "Daglig repetitionsstruktur (muraja'a)",
      "Tätare uppföljning (3 ggr/vecka)",
      "Tajwid integrerat i memorering",
      "Lektionsmaterial i elevportalen",
      "Direkt stöd från hafiza-lärare",
    ],
    highlight: false,
  },
];

const faqs = [
  {
    q: "Hur sker undervisningen?",
    a: "All undervisning sker online via videosamtal (Google Meet eller Zoom). Du behöver bara en dator, surfplatta eller telefon med kamera och mikrofon.",
  },
  {
    q: "Vad händer om jag missar en lektion?",
    a: "Du kan avboka eller boka om lektioner med minst 24 timmars varsel utan extra kostnad. Vi försöker alltid hitta en tid som passar.",
  },
  {
    q: "Är kurserna för alla åldrar?",
    a: "Ja, vi tar emot elever från 8 år och uppåt. Barn och unga undervisas med anpassad pedagogik.",
  },
  {
    q: "Hur betalar jag?",
    a: "Vi använder Klarna som betaltjänst. Du kan betala med kort (Visa/Mastercard) eller Swish. Betalning sker månadsvis.",
  },
  {
    q: "Kan jag prova innan jag anmäler mig?",
    a: "Ja! Vi erbjuder en gratis provlektion på 30 minuter. Kontakta oss via kontaktformuläret så bokar vi in en tid.",
  },
];

export default function Kurser() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-20" style={{ background: "linear-gradient(135deg, #1A1520 0%, #2E1A47 100%)" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">Kurser & Priser</h1>
            <p className="text-white/70 text-lg">
              Välj den kurs som passar din nivå och börja din koranresa i dag.
            </p>
          </div>
        </section>

        {/* Kurskort */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className={`relative rounded-2xl overflow-hidden border transition-shadow hover:shadow-lg ${
                    course.highlight
                      ? "border-[#7B3FB0] shadow-md"
                      : "border-gray-200 bg-white shadow-sm"
                  }`}
                >
                  {course.highlight && (
                    <div className="text-center py-2 text-sm font-semibold text-white" style={{ backgroundColor: "#7B3FB0" }}>
                      Populärast
                    </div>
                  )}

                  <div className={`p-8 ${course.highlight ? "bg-white" : ""}`}>
                    <span
                      className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                      style={{ backgroundColor: "#F5EEFF", color: "#7B3FB0" }}
                    >
                      {course.level}
                    </span>

                    <h2 className="text-xl font-bold text-gray-900 mt-4 mb-2">{course.title}</h2>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6">{course.desc}</p>

                    <div className="flex items-end gap-1 mb-1">
                      <span className="text-4xl font-bold text-gray-900">{course.price}</span>
                      <span className="text-gray-500 mb-1">kr/mån</span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-400 mb-8">
                      <span>{course.duration}</span>
                      <span>•</span>
                      <span>{course.sessions}</span>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {course.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                          <svg className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={`/anmal?kurs=${course.id}`}
                      className="block w-full text-center font-semibold py-3 rounded-xl transition-all active:scale-95"
                      style={
                        course.highlight
                          ? { backgroundColor: "#7B3FB0", color: "white" }
                          : { backgroundColor: "#F5EEFF", color: "#7B3FB0" }
                      }
                    >
                      Anmäl dig nu
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-gray-400 mt-8">
              Betalning sker säkert via Klarna (Visa/Mastercard & Swish). Månadsvis betalning.
            </p>
          </div>
        </section>

        {/* Gratis provlektion */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="rounded-3xl p-10 text-white text-center"
              style={{ background: "linear-gradient(135deg, #5C2D8A 0%, #7B3FB0 100%)" }}
            >
              <h2 className="text-2xl font-bold mb-3">Prova gratis – utan förpliktelse</h2>
              <p className="text-white/75 mb-6">
                Boka en kostnadsfri provlektion på 30 minuter och känn om vår undervisning passar dig.
              </p>
              <Link
                href="/kontakt"
                className="inline-flex items-center gap-2 bg-white font-semibold px-8 py-3 rounded-xl hover:bg-gray-50 transition-all"
                style={{ color: "#7B3FB0" }}
              >
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
                  <button
                    className="w-full flex items-center justify-between px-6 py-4 text-left"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-medium text-gray-900">{faq.q}</span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
                      {faq.a}
                    </div>
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
