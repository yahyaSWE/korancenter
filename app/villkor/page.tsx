import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Villkor() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <section className="py-16" style={{ background: "linear-gradient(135deg, #1A1520 0%, #2E1A47 100%)" }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Allmänna villkor</h1>
            <p className="text-white/60 text-sm">Senast uppdaterade: maj 2026</p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-10 text-gray-700 leading-relaxed">

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Om tjänsten</h2>
                <p>
                  Korancenter erbjuder onlinebaserad koranundervisning för kvinnor via vår digitala plattform.
                  Undervisningen sker via videosamtal och kompletteras med material i elevportalen.
                  Dessa villkor gäller för alla elever som anmäler sig till och deltar i Korancenters kurser.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. Anmälan och godkännande</h2>
                <p>
                  Kursanmälan sker via vår webbplats. En ansökan granskas av administratören och kan
                  godkännas, nekas eller hänvisas till en annan kursnivå. Anmälan är bindande när
                  betalning har genomförts och bekräftelse skickats via e-post.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Betalning</h2>
                <p>
                  Kursavgiften betalas månadsvis i förskott via Klarna (kort eller Swish).
                  Avgiften debiteras automatiskt vid varje ny betalningsperiod. Priserna anges
                  inklusive moms om inget annat anges.
                </p>
                <p className="mt-3">
                  Betalning för tre månader i förväg ger möjlighet till reducerat pris enligt
                  aktuell prislista. Kontakta oss för mer information.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Avbokning och uppsägning</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Avbokning av lektion:</strong> Meddela läraren minst 24 timmar i förväg.
                    Lektioner som missas utan föranmälan ersätts ej.
                  </li>
                  <li>
                    <strong>Uppsägning av kurs:</strong> Kurs kan sägas upp med 30 dagars varsel.
                    Redan betalda avgifter återbetalas ej, men undervisning ges under hela
                    uppsägningsperioden.
                  </li>
                  <li>
                    <strong>Ångerrätt:</strong> Enligt distansavtalslagen gäller 14 dagars ångerrätt
                    från avtalsdagen, förutsatt att undervisningen inte påbörjats.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Missad lektion</h2>
                <p>
                  Om du missar en lektion utan föranmälan erbjuds ingen ersättningslektion.
                  Vid sjukdom eller force majeure – kontakta läraren snarast möjligt, så gör vi
                  vårt bästa för att hitta en lösning.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. Uppförandekod</h2>
                <p>
                  Korancenter är en trygg och respektfull miljö. Alla deltagare förväntas:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>Behandla lärare och medstudenter med respekt</li>
                  <li>Hålla avtalade lektionstider</li>
                  <li>Använda plattformen enbart för utbildningssyfte</li>
                  <li>Inte dela inloggningsuppgifter med andra</li>
                </ul>
                <p className="mt-3">
                  Brott mot uppförandekoden kan leda till att kursen avslutas utan återbetalning.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">7. Immateriella rättigheter</h2>
                <p>
                  Allt material i elevportalen – inklusive PDF:er, videos och ljud – tillhör Korancenter
                  och/eller respektive lärare. Materialet får ej spridas, kopieras eller användas
                  utanför undervisningssyftet.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">8. Ansvarsbegränsning</h2>
                <p>
                  Korancenter ansvarar ej för tekniska störningar utanför vår kontroll, t.ex.
                  internetavbrott eller driftstörningar hos tredjepartsleverantörer. Vi förbehåller
                  oss rätten att ändra lektionsschema vid force majeure och erbjuder i sådana fall
                  alternativa tider.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">9. Ändringar av villkor</h2>
                <p>
                  Vi förbehåller oss rätten att uppdatera dessa villkor. Väsentliga ändringar meddelas
                  via e-post minst 30 dagar i förväg. Fortsatt nyttjande av tjänsten efter
                  ikraftträdandet innebär att du godkänt de nya villkoren.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">10. Tillämplig lag</h2>
                <p>
                  Dessa villkor regleras av svensk rätt. Tvister ska i första hand lösas genom
                  dialog. I andra hand kan tvisten hänskjutas till Allmänna reklamationsnämnden (ARN)
                  eller allmän domstol med Stockholm som forum.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">11. Kontakt</h2>
                <p>
                  Vid frågor om dessa villkor, kontakta oss på{" "}
                  <a href="mailto:info@korancenter.se" className="underline" style={{ color: "#7B3FB0" }}>
                    info@korancenter.se
                  </a>.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <Link href="/" className="text-sm font-medium" style={{ color: "#7B3FB0" }}>
                  ← Tillbaka till startsidan
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
