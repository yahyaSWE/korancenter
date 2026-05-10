"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function SattLosenord() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"checking" | "ready" | "loading" | "success" | "error" | "no-session">("checking");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Supabase JS klienten läser automatiskt access_token från URL-fragmentet
    // och sätter sessionen. Vi väntar lite och kollar att sessionen finns.
    const supabase = createClient();
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStatus("ready");
        // Rensa fragmentet ur URL:en så det inte ligger kvar
        if (window.location.hash) {
          history.replaceState(null, "", window.location.pathname);
        }
      } else {
        setStatus("no-session");
      }
    };
    // Ge Supabase JS en tick att processa fragmentet
    setTimeout(checkSession, 200);
  }, []);

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
      return;
    }

    setStatus("success");
    // Hämta roll och dirigera till rätt portal
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      const dest =
        profile?.role === "admin" ? "/admin" :
        profile?.role === "teacher" ? "/larare" :
        "/portal";
      setTimeout(() => router.push(dest), 1800);
    } else {
      setTimeout(() => router.push("/logga-in"), 1800);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(135deg, #1A1520 0%, #2E1A47 100%)" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <Link href="/" className="flex flex-col items-center gap-2 mb-8">
          <Image src="/images/logo.png" alt="Korancenter" width={56} height={56} className="object-contain" />
          <p className="font-bold" style={{ color: "#7B3FB0" }}>
            Koran<span className="text-gray-800">center</span>
          </p>
        </Link>

        {status === "checking" && (
          <div className="text-center py-8">
            <div className="w-8 h-8 mx-auto rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#7B3FB0", borderTopColor: "transparent" }} />
            <p className="text-gray-500 text-sm mt-4">Verifierar länken…</p>
          </div>
        )}

        {status === "no-session" && (
          <div className="text-center py-6">
            <h1 className="text-xl font-bold text-gray-900 mb-2">Länken är ogiltig eller har gått ut</h1>
            <p className="text-gray-500 text-sm mb-6">
              Återställningslänken kan ha förfallit (giltig i 24 timmar) eller redan använts.
            </p>
            <Link
              href="/aterstall-losenord"
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "#7B3FB0" }}
            >
              Begär en ny länk
            </Link>
          </div>
        )}

        {status === "success" && (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#F5EEFF" }}>
              <svg className="w-7 h-7" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Lösenord uppdaterat!</h3>
            <p className="text-gray-500 text-sm">Du loggas in nu...</p>
          </div>
        )}

        {(status === "ready" || status === "loading" || status === "error") && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Välj nytt lösenord</h1>
            <p className="text-gray-500 text-sm mb-8">
              Välj ett lösenord på minst 6 tecken till ditt konto.
            </p>
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

              {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: "#7B3FB0" }}
              >
                {status === "loading" ? "Sparar..." : "Spara nytt lösenord"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
