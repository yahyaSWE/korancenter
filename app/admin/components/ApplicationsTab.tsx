import type { Course } from "@/lib/supabase/types";
import type { ApplicationRow } from "./types";
import { inputCls, btnPrimary, btnSecondary } from "./types";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:    { label: "Väntar",    color: "bg-amber-50 text-amber-600" },
  approved:   { label: "Godkänd",  color: "bg-green-50 text-green-600" },
  rejected:   { label: "Nekad",    color: "bg-red-50 text-red-500" },
  redirected: { label: "Hänvisad", color: "bg-blue-50 text-blue-600" },
};

type ReviewForm = { status: string; redirect_course_id: string; admin_notes: string; expand_capacity: boolean };

type Props = {
  applications: ApplicationRow[];
  courses: Course[];
  appFilter: string;
  onFilterChange: (f: string) => void;
  appReviewing: ApplicationRow | null;
  appReviewForm: ReviewForm;
  onReviewFormChange: (form: ReviewForm) => void;
  onStartReview: (app: ApplicationRow) => void;
  onCancelReview: () => void;
  onSubmitReview: () => void;
  onResendEmail: (app: ApplicationRow) => void;
  resendingId: string | null;
  saving: boolean;
};

export function ApplicationsTab({
  applications, courses, appFilter, onFilterChange,
  appReviewing, appReviewForm, onReviewFormChange,
  onStartReview, onCancelReview, onSubmitReview, onResendEmail, resendingId, saving,
}: Props) {
  const filtered = applications.filter((a) => appFilter === "all" || a.status === appFilter);
  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const decisionCourseId = appReviewForm.status === "redirected"
    ? appReviewForm.redirect_course_id
    : appReviewing?.course_id;
  const decisionCourse = courses.find((course) => course.id === decisionCourseId);
  const decisionEnrolled = decisionCourse?.enrolled_count ?? 0;
  const decisionMax = decisionCourse?.max_participants ?? null;
  const decisionCourseIsFull = decisionMax !== null && decisionEnrolled >= decisionMax;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Ansökningar ({applications.length})</h2>
          <div className="flex gap-2 flex-wrap">
            {([["pending","Väntar"],["approved","Godkända"],["rejected","Nekade"],["redirected","Hänvisade"],["all","Alla"]] as [string, string][]).map(([val, label]) => (
              <button key={val} onClick={() => onFilterChange(val)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${appFilter === val ? "text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                style={appFilter === val ? { backgroundColor: "#7B3FB0" } : {}}>
                {label}{val === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Datum</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sökande</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Kurs</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Erfarenhet</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">Inga ansökningar.</td></tr>
              ) : filtered.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">{new Date(app.created_at).toLocaleDateString("sv-SE")}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{app.name}</p>
                    <p className="text-xs text-gray-400">{app.email} · {app.phone}</p>
                    {app.address && <p className="text-xs text-gray-400">{app.address}, {app.postal_code} {app.city}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#F5EEFF", color: "#7B3FB0" }}>
                      {app.course?.title ?? "–"}
                    </span>
                    {app.redirect_course && <p className="text-xs text-blue-500 mt-1">→ {app.redirect_course.title}</p>}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs max-w-[200px] truncate">{app.experience ?? <span className="italic text-gray-300">Ej angivet</span>}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_LABELS[app.status]?.color ?? ""}`}>
                        {STATUS_LABELS[app.status]?.label ?? app.status}
                      </span>
                      {app.status === "approved" && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          app.payment_status === "paid"
                            ? "bg-green-50 text-green-600"
                            : app.payment_status === "pending"
                            ? "bg-amber-50 text-amber-600"
                            : app.payment_status === "cancelled"
                            ? "bg-gray-100 text-gray-500"
                            : app.payment_status
                            ? "bg-gray-100 text-gray-500"
                            : "bg-red-50 text-red-600"
                        }`}>
                          {app.payment_status === "paid" && "✓ Betald"}
                          {app.payment_status === "pending" && "⏳ Väntar på betalning"}
                          {app.payment_status === "cancelled" && "Avbruten"}
                          {app.payment_status === "refunded" && "Återbetald"}
                          {!app.payment_status && "⚠ Saknar kursplats"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {app.status === "pending" && (
                      <button onClick={() => onStartReview(app)} className="text-xs font-medium hover:underline" style={{ color: "#7B3FB0" }}>
                        Granska
                      </button>
                    )}
                    {app.status === "approved" && app.payment_status !== "paid" && (
                      <button
                        onClick={() => onResendEmail(app)}
                        disabled={resendingId === app.id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: "#7B3FB0" }}
                      >
                        {resendingId === app.id ? "Skickar..." : "Skicka betalningslänk"}
                      </button>
                    )}
                    {app.status === "approved" && app.payment_status === "paid" && (
                      <button
                        onClick={() => onResendEmail(app)}
                        disabled={resendingId === app.id}
                        className="text-xs font-medium hover:underline disabled:opacity-50"
                        style={{ color: "#7B3FB0" }}
                      >
                        {resendingId === app.id ? "Skickar..." : "Skicka mejl igen"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review modal */}
      {appReviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Granska – {appReviewing.name}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{appReviewing.course?.title} · {appReviewing.email}</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              {appReviewing.experience && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">{appReviewing.experience}</div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-2">Beslut</label>
                <div className="flex gap-2 flex-wrap">
                  {([["approved","✓ Godkänn","bg-green-50 border-green-300 text-green-700"],["rejected","✗ Neka","bg-red-50 border-red-300 text-red-600"],["redirected","→ Hänvisa","bg-blue-50 border-blue-300 text-blue-600"]] as [string,string,string][]).map(([val, label, cls]) => (
                    <button key={val} onClick={() => onReviewFormChange({ ...appReviewForm, status: val, expand_capacity: false })}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${appReviewForm.status === val ? cls + " border-2" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {appReviewForm.status === "redirected" && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Hänvisa till kurs</label>
                  <select value={appReviewForm.redirect_course_id}
                    onChange={(e) => onReviewFormChange({ ...appReviewForm, redirect_course_id: e.target.value, expand_capacity: false })}
                    className={inputCls}>
                    <option value="">Välj kurs...</option>
                    {courses.filter((c) => c.id !== appReviewing.course_id).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}{c.max_participants !== null && (c.enrolled_count ?? 0) >= c.max_participants ? " (full)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {decisionCourseIsFull && (appReviewForm.status === "approved" || appReviewForm.status === "redirected") && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">Kursen är full ({decisionEnrolled}/{decisionMax} platser).</p>
                  <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-amber-900">
                    <input
                      type="checkbox"
                      checked={appReviewForm.expand_capacity}
                      onChange={(e) => onReviewFormChange({ ...appReviewForm, expand_capacity: e.target.checked })}
                      className="mt-0.5 h-4 w-4 rounded border-amber-400 accent-[#7B3FB0]"
                    />
                    <span>Utöka kursens kapacitet med 1 plats för den här eleven.</span>
                  </label>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Anteckning till sökande (valfri)</label>
                <textarea value={appReviewForm.admin_notes}
                  onChange={(e) => onReviewFormChange({ ...appReviewForm, admin_notes: e.target.value })}
                  className={inputCls + " resize-none"} rows={3}
                  placeholder="T.ex. Vi rekommenderar att du börjar med nybörjarkursen..." />
              </div>
              <p className="text-xs text-gray-400">Sökande får automatiskt ett e-postmeddelande.</p>
              <div className="flex gap-3">
                <button onClick={onCancelReview} className={btnSecondary + " flex-1"}>Avbryt</button>
                <button
                  disabled={saving || (appReviewForm.status === "redirected" && !appReviewForm.redirect_course_id) || (decisionCourseIsFull && !appReviewForm.expand_capacity)}
                  onClick={onSubmitReview}
                  className={btnPrimary + " flex-1 disabled:opacity-50"}
                  style={{ backgroundColor: "#7B3FB0" }}>
                  {saving ? "Sparar..." : "Skicka svar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
