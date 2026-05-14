"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoggaIn() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error, data } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (error || !data.user) {
      setError("Fel e-postadress eller lösenord. Försök igen.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const dest =
      profile?.role === "admin" ? "/admin" :
      profile?.role === "teacher" ? "/larare" :
      "/portal";
    router.push(dest);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #1A1520 0%, #2E1A47 100%)" }}>
      {/* Vänster panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-xs text-center">
          <h2 className="text-3xl font-bold mb-4">Välkommen tillbaka</h2>
          <p className="text-white/70 leading-relaxed">
            Logga in för att komma åt dina kurser, se ditt schema och kommunicera med din lärare.
          </p>
        </div>

        {/* Islamiskt ornament */}
        <div className="mt-16 opacity-20">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
            <path d="M60 5 L115 60 L60 115 L5 60 Z" stroke="white" strokeWidth="2" fill="none" />
            <circle cx="60" cy="60" r="35" stroke="white" strokeWidth="1.5" fill="none" />
            <circle cx="60" cy="60" r="18" stroke="white" strokeWidth="1" fill="none" />
            <path d="M60 25 L95 60 L60 95 L25 60 Z" stroke="white" strokeWidth="1" fill="none" />
          </svg>
        </div>
      </div>

      {/* Höger panel – formulär */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:bg-white lg:rounded-l-3xl">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 lg:bg-transparent lg:rounded-none lg:shadow-none lg:p-0">
          {/* Logga */}
          <Link href="/" className="flex flex-col items-center gap-2 mb-8">
            <Image src="/images/logo.png" alt="Korancenter" width={64} height={64} className="object-contain" />
            <p className="font-bold text-xl" style={{ color: "#7B3FB0" }}>
              Koran<span className="text-gray-800">center</span>
            </p>
          </Link>

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Logga in</h1>
            <p className="text-gray-500">Välkommen tillbaka till elevportalen.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-postadress</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="din@epost.se"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0] focus:border-transparent"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Lösenord</label>
                <Link href="/aterstall-losenord" className="text-xs hover:underline" style={{ color: "#7B3FB0" }}>
                  Glömt lösenordet?
                </Link>
              </div>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Ditt lösenord"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0] focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
              style={{ backgroundColor: "#7B3FB0" }}
            >
              {loading ? "Loggar in..." : "Logga in"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Inte registrerad?{" "}
              <Link href="/kurser" className="font-medium hover:underline" style={{ color: "#7B3FB0" }}>
                Se våra kurser och anmäl dig
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
              ← Tillbaka till startsidan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
