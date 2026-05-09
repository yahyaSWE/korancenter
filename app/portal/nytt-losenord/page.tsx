"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NyttLosenord() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 6) {
      setErrorMsg("Lösenordet måste vara minst 6 tecken.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Lösenorden matchar inte.");
      return;
    }

    setStatus("loading");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMsg(error.message ?? "Något gick fel. Försök begära en ny återställningslänk.");
      setStatus("error");
    } else {
      setStatus("success");
      setTimeout(() => router.push("/portal"), 2500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(135deg, #1A1520 0%, #2E1A47 100%)" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <Link href="/" className="flex items-center gap-3 mb-8">
          <Image src="/images/logo.png" alt="Korancenter" width={40} height={40} className="object-contain" />
          <p className="font-bold" style={{ color: "#7B3FB0" }}>Korancenter</p>
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Skapa nytt lösenord</h1>
        <p className="text-gray-500 text-sm mb-8">
          Välj ett nytt lösenord för ditt konto. Lösenordet måste vara minst 6 tecken.
        </p>

        {status === "success" ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#F5EEFF" }}>
              <svg className="w-7 h-7" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Lösenord uppdaterat!</h3>
            <p className="text-gray-500 text-sm">Du skickas nu till elevportalen...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nytt lösenord</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minst 6 tecken"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bekräfta lösenord</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Upprepa lösenordet"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0] focus:border-transparent"
              />
            </div>

            {(errorMsg || status === "error") && (
              <p className="text-red-500 text-sm">{errorMsg || "Något gick fel. Försök begära en ny återställningslänk."}</p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "#7B3FB0" }}
            >
              {status === "loading" ? "Sparar..." : "Spara nytt lösenord"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/aterstall-losenord" className="text-sm text-gray-400 hover:text-gray-600">
            Behöver du en ny återställningslänk?
          </Link>
        </div>
      </div>
    </div>
  );
}
