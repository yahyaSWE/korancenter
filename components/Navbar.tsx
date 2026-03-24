"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Hem" },
  { href: "/om-oss", label: "Om oss" },
  { href: "/kurser", label: "Kurser & Priser" },
  { href: "/kontakt", label: "Kontakt" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="Korancenter logga"
              width={52}
              height={52}
              className="object-contain"
              priority
            />
            <div className="hidden sm:block">
              <p className="text-lg font-bold leading-tight" style={{ color: "#7B3FB0" }}>
                Koran<span className="text-gray-900">center</span>
              </p>
              <p className="text-xs text-gray-500 tracking-wide">Lär dig Koranen</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-[#7B3FB0] ${
                  pathname === link.href
                    ? "text-[#7B3FB0] border-b-2 border-[#7B3FB0] pb-0.5"
                    : "text-gray-700"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/logga-in"
              className="text-sm font-medium text-gray-700 hover:text-[#7B3FB0] transition-colors"
            >
              Logga in
            </Link>
            <Link
              href="/kurser"
              className="text-sm font-semibold text-white px-4 py-2 rounded-lg transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: "#7B3FB0" }}
            >
              Anmäl dig
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-700"
            onClick={() => setOpen(!open)}
            aria-label="Öppna meny"
          >
            {open ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block text-sm font-medium py-2 transition-colors hover:text-[#7B3FB0] ${
                pathname === link.href ? "text-[#7B3FB0]" : "text-gray-700"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
            <Link
              href="/logga-in"
              onClick={() => setOpen(false)}
              className="block text-sm font-medium text-gray-700 py-2 hover:text-[#7B3FB0]"
            >
              Logga in
            </Link>
            <Link
              href="/kurser"
              onClick={() => setOpen(false)}
              className="block text-sm font-semibold text-white text-center px-4 py-2 rounded-lg"
              style={{ backgroundColor: "#7B3FB0" }}
            >
              Anmäl dig
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
