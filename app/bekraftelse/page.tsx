import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Bekraftelse() {
  return (
    <>
      <Navbar />
      <main className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "#F5EEFF" }}>
            <svg className="w-10 h-10" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Betalning bekräftad!</h1>
          <p className="text-gray-500 leading-relaxed mb-2">
            Tack för din betalning. Din kursplats är nu aktiverad och prenumerationen är igång.
          </p>
          <p className="text-gray-400 text-sm mb-8">
            Du debiteras var tredje månad. Du kan när som helst avsluta prenumerationen direkt i din elevportal.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/portal"
              className="px-6 py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#7B3FB0" }}
            >
              Gå till elevportalen
            </Link>
            <Link
              href="/"
              className="px-6 py-3 rounded-xl font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Tillbaka till startsidan
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
