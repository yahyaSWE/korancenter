"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function AterstallLosenord() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setStatus(res.ok ? "success" : "error");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(135deg, #1A1520 0%, #2E1A47 100%)" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <Link href="/" className="flex items-center gap-3 mb-8">
          <Image src="/images/logo.png" alt="Korancenter" width={40} height={40} className="object-contain" />
          <p className="font-bold" style={{ color: "#7B3FB0" }}>Korancenter</p>
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Återställ lösenord</h1>
        <p className="text-gray-500 text-sm mb-8">
          Ange din e-postadress som registrerades vid anmälan. Vi skickar en länk för att återställa ditt lösenord.
        </p>

        {status === "success" ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#F5EEFF" }}>
              <svg className="w-7 h-7" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Mejl skickat!</h3>
            <p className="text-gray-500 text-sm">
              Kontrollera din inkorg och klicka på länken för att återställa ditt lösenord.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-postadress</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@epost.se"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0] focus:border-transparent"
              />
            </div>

            {status === "error" && (
              <p className="text-red-500 text-sm">Något gick fel. Kontrollera e-postadressen och försök igen.</p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "#7B3FB0" }}
            >
              {status === "loading" ? "Skickar..." : "Skicka återställningslänk"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/logga-in" className="text-sm text-gray-400 hover:text-gray-600">
            ← Tillbaka till inloggning
          </Link>
        </div>
      </div>
    </div>
  );
}
