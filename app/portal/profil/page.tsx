"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProfilPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pwStatus, setPwStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [pwErrorMsg, setPwErrorMsg] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setEmail(user.email ?? "");
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      setFullName(data?.full_name ?? "");
    });
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setStatus("saving");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setStatus("error"); setErrorMsg("Ej inloggad."); return; }

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() })
      .eq("id", user.id);

    if (error) {
      setErrorMsg("Kunde inte spara. Försök igen.");
      setStatus("error");
    } else {
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErrorMsg("");
    if (newPassword.length < 6) { setPwErrorMsg("Lösenordet måste vara minst 6 tecken."); return; }
    if (newPassword !== confirmPassword) { setPwErrorMsg("Lösenorden matchar inte."); return; }
    setPwStatus("saving");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwErrorMsg(error.message ?? "Kunde inte byta lösenord.");
      setPwStatus("error");
    } else {
      setNewPassword("");
      setConfirmPassword("");
      setPwStatus("saved");
      setTimeout(() => setPwStatus("idle"), 3000);
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0] focus:border-transparent";

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Min profil</h1>
        <p className="text-gray-500 text-sm mt-1">Uppdatera ditt namn och lösenord här.</p>
      </div>

      {/* Profilinformation */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Profilinformation</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fullständigt namn</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ditt namn"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">E-postadress</label>
            <input
              type="email"
              value={email}
              disabled
              className={inputCls + " bg-gray-50 text-gray-400 cursor-not-allowed"}
            />
            <p className="text-xs text-gray-400 mt-1">E-postadressen kan ej ändras här. Kontakta administratören.</p>
          </div>
          {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
          <button
            type="submit"
            disabled={status === "saving"}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: "#7B3FB0" }}
          >
            {status === "saving" ? "Sparar..." : status === "saved" ? "Sparat!" : "Spara ändringar"}
          </button>
        </form>
      </div>

      {/* Byt lösenord */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Byt lösenord</h2>
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nytt lösenord</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minst 6 tecken"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bekräfta nytt lösenord</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Upprepa lösenordet"
              className={inputCls}
            />
          </div>
          {pwErrorMsg && <p className="text-red-500 text-sm">{pwErrorMsg}</p>}
          <button
            type="submit"
            disabled={pwStatus === "saving" || !newPassword}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: "#7B3FB0" }}
          >
            {pwStatus === "saving" ? "Byter..." : pwStatus === "saved" ? "Lösenord bytt!" : "Byt lösenord"}
          </button>
        </form>
      </div>
    </div>
  );
}
