import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Integritetspolicy() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-white">
        <section className="py-16" style={{ background: "linear-gradient(135deg, #1A1520 0%, #2E1A47 100%)" }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Integritetspolicy</h1>
            <p className="text-white/60 text-sm">Senast uppdaterad: maj 2026</p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-gray max-w-none">
            <div className="space-y-10 text-gray-700 leading-relaxed">

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Personuppgiftsansvarig</h2>
                <p>
                  Korancenter är personuppgiftsansvarig för behandlingen av dina personuppgifter. Vid frågor om
                  hur vi hanterar dina uppgifter är du välkommen att kontakta oss på{" "}
                  <a href="mailto:info@korancenter.se" className="underline" style={{ color: "#7B3FB0" }}>
                    info@korancenter.se
                  </a>.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. Vilka uppgifter samlar vi in?</h2>
                <p>Vi samlar in följande kategorier av personuppgifter:</p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li><strong>Kontaktuppgifter:</strong> namn, e-postadress och telefonnummer</li>
                  <li><strong>Adressuppgifter:</strong> gatuadress, postnummer och ort (vid ansökan)</li>
                  <li><strong>Utbildningsinformation:</strong> tidigare erfarenhet av koranstudier</li>
                  <li><strong>Betalningsinformation:</strong> hanteras av Klarna och når aldrig våra system</li>
                  <li><strong>Användarkonto:</strong> e-postadress och krypterat lösenord via Supabase</li>
                  <li><strong>Kommunikation:</strong> meddelanden skickade via vår plattform</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Varför behandlar vi dina uppgifter?</h2>
                <p>Vi behandlar dina personuppgifter för följande ändamål:</p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>Hantera din kursansökan och enrollering</li>
                  <li>Tillhandahålla elevportal med lektionsmaterial och schema</li>
                  <li>Möjliggöra kommunikation mellan elever och lärare</li>
                  <li>Skicka information om kurser och lektioner</li>
                  <li>Hantera betalningar via Klarna</li>
                  <li>Uppfylla rättsliga förpliktelser</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Rättslig grund</h2>
                <p>
                  Vi behandlar dina personuppgifter med stöd av avtal (för att fullgöra kursavtalet),
                  berättigat intresse (för att administrera verksamheten) samt samtycke (för
                  marknadsföringsutskick, om tillämpligt).
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Hur länge sparar vi dina uppgifter?</h2>
                <p>
                  Vi sparar dina uppgifter så länge som ditt konto är aktivt eller så länge det krävs för
                  att fullgöra ändamålen ovan. Bokföringsuppgifter sparas i enlighet med
                  bokföringslagen (7 år). Du kan när som helst begära radering av ditt konto.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. Tredje parter</h2>
                <p>Vi delar uppgifter med följande tjänsteleverantörer:</p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li><strong>Supabase</strong> – databas och autentisering (EU-datalagring)</li>
                  <li><strong>Klarna</strong> – betalningshantering</li>
                  <li><strong>Resend</strong> – e-postutskick</li>
                  <li><strong>Vercel</strong> – webbhotell</li>
                </ul>
                <p className="mt-3">
                  Alla leverantörer är bundna av databehandlingsavtal och behandlar uppgifter enbart på
                  våra instruktioner.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">7. Dina rättigheter</h2>
                <p>Enligt GDPR har du rätt att:</p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>Få tillgång till de uppgifter vi behandlar om dig</li>
                  <li>Begära rättelse av felaktiga uppgifter</li>
                  <li>Begära radering av dina uppgifter (&quot;rätten att bli glömd&quot;)</li>
                  <li>Begära begränsning av behandlingen</li>
                  <li>Invända mot behandling</li>
                  <li>Dataportabilitet</li>
                </ul>
                <p className="mt-3">
                  För att utöva dina rättigheter, kontakta oss på{" "}
                  <a href="mailto:info@korancenter.se" className="underline" style={{ color: "#7B3FB0" }}>
                    info@korancenter.se
                  </a>. Du har även rätt att lämna klagomål till{" "}
                  <a href="https://www.imy.se" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#7B3FB0" }}>
                    Integritetsskyddsmyndigheten (IMY)
                  </a>.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">8. Cookies</h2>
                <p>
                  Vi använder nödvändiga cookies för att hantera din inloggningssession. Inga
                  spårningscookies eller tredjepartscookies för reklam används.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">9. Kontakt</h2>
                <p>
                  Vid frågor om denna policy, kontakta oss på{" "}
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
