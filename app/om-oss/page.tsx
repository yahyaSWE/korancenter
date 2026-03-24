import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const teachers = [
  {
    name: "Fatima Al-Rashid",
    title: "Koranläsning & Tajwid",
    bio: "Fatima har studerat Koranvetenskap i tio år och är certifierad lärare i tajwid med ijaza. Hon undervisar med stor tålamod och pedagogisk kompetens.",
    specialties: ["Tajwid", "Koranläsning", "Nybörjare"],
    initials: "FA",
  },
  {
    name: "Maryam Hassan",
    title: "Memorering (Hifz)",
    bio: "Maryam är hafiza och har memorerat hela Koranen. Hon har lång erfarenhet av att vägleda elever i sin memoreringsresa med ett strukturerat och motiverande upplägg.",
    specialties: ["Hifz", "Memorering", "Avancerad"],
    initials: "MH",
  },
  {
    name: "Aisha Karimi",
    title: "Grundläggande arabiska & Koranläsning",
    bio: "Aisha undervisar nybörjare och barn i att känna igen arabiska bokstäver och läsa Koranen från grunden. Hennes tydliga pedagogik gör inlärningen enkel och rolig.",
    specialties: ["Arabiska", "Nybörjare", "Barn & unga"],
    initials: "AK",
  },
  {
    name: "Zainab Mahmoud",
    title: "Avancerad Koranläsning",
    bio: "Zainab har studerat vid islamiska universitet och är specialiserad på avancerad recitation och fördjupad tajwid. Hon guidar elever mot en mer djupgående förståelse av Koranen.",
    specialties: ["Avancerad tajwid", "Recitation", "Fördjupning"],
    initials: "ZM",
  },
];

export default function OmOss() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-20" style={{ background: "linear-gradient(135deg, #1A1520 0%, #2E1A47 100%)" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">Om Korancenter</h1>
            <p className="text-white/70 text-lg leading-relaxed">
              Vi är ett online-institut grundat med syfte att göra koranundervisning tillgänglig för alla kvinnor –
              oavsett var i världen de befinner sig.
            </p>
          </div>
        </section>

        {/* Om institutet */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Text */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Vår vision & vårt syfte</h2>
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  <p>
                    Korancenter grundades med övertygelsen att alla muslimska kvinnor förtjänar tillgång till
                    professionell koranundervisning – i en trygg, respektfull och bekväm miljö.
                  </p>
                  <p>
                    Vi erbjuder undervisning helt online, vilket gör det möjligt för dig att lära dig Koranen
                    hemifrån och i din egen takt. Alla våra lärare är kvinnor med gedigen utbildning och
                    dokumenterad kompetens.
                  </p>
                  <p>
                    Vår målsättning är inte bara att lära ut läsning och memorering – vi vill även inspirera en
                    djupare relation till Koranen och dess budskap.
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  {[
                    { label: "Grundat", value: "2020" },
                    { label: "Elever totalt", value: "100+" },
                    { label: "Lärare", value: "4 st" },
                    { label: "Kurser", value: "3 nivåer" },
                  ].map((item) => (
                    <div key={item.label} className="bg-gray-50 rounded-xl p-4">
                      <p className="text-2xl font-bold" style={{ color: "#7B3FB0" }}>{item.value}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dekorativ panel */}
              <div
                className="relative rounded-3xl p-10 text-white overflow-hidden"
                style={{ background: "linear-gradient(135deg, #5C2D8A 0%, #7B3FB0 100%)" }}
              >
                {/* Arabiskt ornament */}
                <div className="absolute top-0 right-0 opacity-10">
                  <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
                    <path d="M100 10 L190 100 L100 190 L10 100 Z" stroke="white" strokeWidth="2" fill="none" />
                    <circle cx="100" cy="100" r="60" stroke="white" strokeWidth="1.5" fill="none" />
                    <circle cx="100" cy="100" r="30" stroke="white" strokeWidth="1" fill="none" />
                    <path d="M100 40 L160 100 L100 160 L40 100 Z" stroke="white" strokeWidth="1" fill="none" />
                  </svg>
                </div>

                <h3 className="text-2xl font-bold mb-6">Varför Korancenter?</h3>
                <ul className="space-y-4">
                  {[
                    "100% online – lär dig hemifrån",
                    "Utbildade & certifierade lärare",
                    "Trygg miljö med endast kvinnliga lärare",
                    "Individanpassad undervisning",
                    "Flexibla tider som passar ditt schema",
                    "Lektionsmaterial i elevportalen",
                  ].map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-white/90 text-sm">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Lärare */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Våra lärare</h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Möt vårt team av utbildade och erfarna lärare som guidar dig på din koranresa.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {teachers.map((teacher) => (
                <div key={teacher.name} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex gap-6">
                  {/* Avatar */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0"
                    style={{ backgroundColor: "#7B3FB0" }}
                  >
                    {teacher.initials}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{teacher.name}</h3>
                    <p className="text-sm font-medium mb-3" style={{ color: "#7B3FB0" }}>{teacher.title}</p>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">{teacher.bio}</p>
                    <div className="flex flex-wrap gap-2">
                      {teacher.specialties.map((s) => (
                        <span
                          key={s}
                          className="text-xs font-medium px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: "#F5EEFF", color: "#7B3FB0" }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
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
