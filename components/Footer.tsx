import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#1A1520] text-white">
      {/* Decorative top border */}
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #7B3FB0, #5C2D8A)" }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-3 mb-4">
              <Image
                src="/images/logo.png"
                alt="Korancenter logga"
                width={44}
                height={44}
                className="object-contain brightness-0 invert"
              />
              <div>
                <p className="font-bold text-lg leading-tight">
                  Koran<span style={{ color: "#C49BD3" }}>center</span>
                </p>
                <p className="text-xs text-gray-400">Lär dig Koranen</p>
              </div>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Ett professionellt online-institut för kvinnor som vill lära sig läsa och memorera Koranen – med
              utbildade, kvinnliga lärare.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-300 mb-4">Sidor</h3>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Hem" },
                { href: "/om-oss", label: "Om oss" },
                { href: "/kurser", label: "Kurser & Priser" },
                { href: "/kontakt", label: "Kontakt" },
                { href: "/logga-in", label: "Elevportal" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-300 mb-4">Kontakt</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:info@korancenter.se" className="hover:text-white transition-colors">
                  info@korancenter.se
                </a>
              </li>
            </ul>
            <div className="mt-6">
              <p className="text-xs text-gray-500">Undervisning sker online via videosamtal.</p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Korancenter. Alla rättigheter förbehållna.</p>
          <div className="flex gap-4">
            <Link href="/integritetspolicy" className="hover:text-gray-300 transition-colors">Integritetspolicy</Link>
            <Link href="/villkor" className="hover:text-gray-300 transition-colors">Villkor</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
