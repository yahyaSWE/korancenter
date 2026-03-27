"use client";

import { useState, useEffect } from "react";

type Application = {
  id: string;
  course_id: string;
  name: string;
  email: string;
  phone: string;
  experience: string | null;
  status: string;
  admin_notes: string | null;
  redirect_course_id: string | null;
  created_at: string;
  course: { id: string; title: string } | null;
  redirect_course: { id: string; title: string } | null;
};

type Course = { id: string; title: string };

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: "Väntar",     color: "bg-amber-50 text-amber-600" },
  approved:   { label: "Godkänd",   color: "bg-green-50 text-green-600" },
  rejected:   { label: "Nekad",     color: "bg-red-50 text-red-500" },
  redirected: { label: "Hänvisad",  color: "bg-blue-50 text-blue-600" },
};

export default function LarareAnsokningar() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [courses, setCourses]           = useState<Course[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState("pending");
  const [expanded, setExpanded]         = useState<string | null>(null);
  const [reviewing, setReviewing]       = useState<Application | null>(null);
  const [reviewForm, setReviewForm]     = useState({ status: "approved", redirect_course_id: "", admin_notes: "" });
  const [saving, setSaving]             = useState(false);
  const [toast, setToast]               = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/teacher/applications").then((r) => r.json()),
      fetch("/api/admin/courses").then((r) => r.json()),
    ]).then(([apps, c]) => {
      if (!apps.error) setApplications(apps);
      if (!c.error) setCourses(c);
      setLoading(false);
    });
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const openReview = (app: Application) => {
    setReviewing(app);
    setReviewForm({ status: "approved", redirect_course_id: "", admin_notes: "" });
  };

  const submitReview = async () => {
    if (!reviewing) return;
    setSaving(true);
    const res = await fetch("/api/teacher/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: reviewing.id, ...reviewForm }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setApplications((prev) => prev.map((a) => a.id === reviewing.id ? { ...a, status: reviewForm.status } : a));
      setReviewing(null);
      showToast("Ansökan uppdaterad och sökande notifierad via e-post.");
    } else {
      showToast(data.error ?? "Något gick fel.");
    }
  };

  const filtered = applications.filter((a) => filter === "all" || a.status === filter);
  const pendingCount = applications.filter((a) => a.status === "pending").length;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#7B3FB0", borderTopColor: "transparent" }} /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#7B3FB0] text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ansökningar</h1>
          <p className="text-gray-500 mt-1">{pendingCount > 0 ? `${pendingCount} väntar på granskning` : "Inga väntande ansökningar"}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[["pending", "Väntar"], ["approved", "Godkända"], ["rejected", "Nekade"], ["redirected", "Hänvisade"], ["all", "Alla"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === val ? "text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            style={filter === val ? { backgroundColor: "#7B3FB0" } : {}}>
            {label}
            {val === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 bg-white/20 text-white text-xs rounded-full px-1.5">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400 text-sm">
            Inga ansökningar {filter !== "all" ? "med denna status" : ""}.
          </div>
        ) : filtered.map((app) => (
          <div key={app.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div
              className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpanded(expanded === app.id ? null : app.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: "#7B3FB0" }}>
                  {app.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{app.name}</p>
                  <p className="text-xs text-gray-400">{app.course?.title} · {new Date(app.created_at).toLocaleDateString("sv-SE")}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_LABELS[app.status]?.color ?? ""}`}>
                  {STATUS_LABELS[app.status]?.label ?? app.status}
                </span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded === app.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {expanded === app.id && (
              <div className="px-6 pb-5 border-t border-gray-100 pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-400 text-xs font-medium uppercase tracking-wide">E-post</span><p className="text-gray-800 mt-0.5">{app.email}</p></div>
                  <div><span className="text-gray-400 text-xs font-medium uppercase tracking-wide">Telefon</span><p className="text-gray-800 mt-0.5">{app.phone}</p></div>
                </div>
                {app.experience && (
                  <div>
                    <span className="text-gray-400 text-xs font-medium uppercase tracking-wide">Erfarenhet / nivå</span>
                    <p className="text-gray-700 text-sm mt-1 bg-gray-50 rounded-lg p-3">{app.experience}</p>
                  </div>
                )}
                {app.admin_notes && (
                  <div>
                    <span className="text-gray-400 text-xs font-medium uppercase tracking-wide">Anteckningar</span>
                    <p className="text-gray-700 text-sm mt-1 italic">{app.admin_notes}</p>
                  </div>
                )}
                {app.redirect_course && (
                  <p className="text-sm text-blue-600">Hänvisad till: <strong>{app.redirect_course.title}</strong></p>
                )}
                {app.status === "pending" && (
                  <div className="pt-2">
                    <button onClick={() => openReview(app)}
                      className="px-5 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90"
                      style={{ backgroundColor: "#7B3FB0" }}>
                      Granska ansökan
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Review modal */}
      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Granska – {reviewing.name}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{reviewing.course?.title}</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-2">Beslut</label>
                <div className="flex gap-2 flex-wrap">
                  {[["approved", "✓ Godkänn", "bg-green-50 border-green-300 text-green-700"], ["rejected", "✗ Neka", "bg-red-50 border-red-300 text-red-600"], ["redirected", "→ Hänvisa till annan kurs", "bg-blue-50 border-blue-300 text-blue-600"]].map(([val, label, cls]) => (
                    <button key={val} onClick={() => setReviewForm(p => ({ ...p, status: val }))}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${reviewForm.status === val ? cls + " border-2" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {reviewForm.status === "redirected" && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Hänvisa till kurs</label>
                  <select value={reviewForm.redirect_course_id}
                    onChange={(e) => setReviewForm(p => ({ ...p, redirect_course_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B3FB0]/30">
                    <option value="">Välj kurs...</option>
                    {courses.filter((c) => c.id !== reviewing.course_id).map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Anteckning till sökande (valfri)</label>
                <textarea value={reviewForm.admin_notes}
                  onChange={(e) => setReviewForm(p => ({ ...p, admin_notes: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#7B3FB0]/30"
                  rows={3} placeholder="T.ex. Vi rekommenderar att du börjar med nybörjarkursen..." />
              </div>

              <p className="text-xs text-gray-400">Sökande får automatiskt ett e-postmeddelande med ditt svar.</p>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setReviewing(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">
                  Avbryt
                </button>
                <button onClick={submitReview} disabled={saving || (reviewForm.status === "redirected" && !reviewForm.redirect_course_id)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90"
                  style={{ backgroundColor: "#7B3FB0" }}>
                  {saving ? "Sparar..." : "Skicka svar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
