import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { expandWeeklySchedule } from "@/lib/lessons";
import SubscriptionCard from "./components/SubscriptionCard";

export default async function PortalDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/logga-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, course_id, payment_status, subscription_status, current_period_end, stripe_subscription_id, course:courses!course_id(title, is_subscription, meeting_link, weekly_schedule)")
    .eq("student_id", user.id)
    .eq("payment_status", "paid");

  const activeEnrollments = enrollments ?? [];
  const courseIds = activeEnrollments.map((e) => e.course_id);

  // Hämta lärarens senaste anteckning (läxa + vad ni gjorde) per kurs.
  // Interna anteckningar (notes) hämtas INTE — de är endast för läraren.
  const adminClient = createAdminClient();
  const { data: noteRows } = courseIds.length > 0
    ? await adminClient
        .from("lesson_notes")
        .select("course_id, homework, summary, lesson_date")
        .eq("student_id", user.id)
        .in("course_id", courseIds)
        .order("lesson_date", { ascending: false })
        .order("created_at", { ascending: false })
    : { data: [] };
  // Behåll bara senaste posten per kurs (raderna kommer redan sorterade nyast först)
  const progressByCourse = new Map<string, { homework: string | null; last_lesson_summary: string | null; updated_at: string }>();
  for (const p of noteRows ?? []) {
    if (progressByCourse.has(p.course_id)) continue;
    progressByCourse.set(p.course_id, {
      homework: p.homework,
      last_lesson_summary: p.summary,
      updated_at: p.lesson_date,
    });
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + 60 * 86_400_000);

  const [{ data: dbLessons }, { data: messages }, { count: completedCount }] =
    await Promise.all([
      courseIds.length > 0
        ? supabase
            .from("lessons")
            .select("*, course:courses(title)")
            .in("course_id", courseIds)
            .eq("is_cancelled", false)
            .gte("scheduled_at", now.toISOString())
            .order("scheduled_at", { ascending: true })
            .limit(8)
        : Promise.resolve({ data: [] }),
      supabase
        .from("messages")
        .select("*, sender:profiles!sender_id(full_name, email)")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1),
      courseIds.length > 0
        ? supabase
            .from("lessons")
            .select("*", { count: "exact", head: true })
            .in("course_id", courseIds)
            .lt("scheduled_at", new Date().toISOString())
        : Promise.resolve({ count: 0 }),
    ]);

  const { count: unreadCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false);

  const firstName = profile?.full_name?.split(" ")[0] ?? "tillbaka";
  const latestMessage = messages?.[0];

  // Slå ihop konkreta lektioner från databasen med virtuella från weekly_schedule
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const virtualLessons = activeEnrollments.flatMap((e: any) => {
    const c = e.course;
    if (!c) return [];
    return expandWeeklySchedule(
      { id: e.course_id, title: c.title, weekly_schedule: c.weekly_schedule, meeting_link: c.meeting_link },
      now,
      horizon,
      4,
    );
  });
  const upcomingLessons = [...(dbLessons ?? []), ...virtualLessons]
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 4);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Välkommen tillbaka, {firstName}!</h1>
        <p className="text-gray-500 mt-1">Här är en översikt av dina kurser och kommande lektioner.</p>
      </div>

      {/* Lektionsrum (Teams) */}
      {activeEnrollments.some((e) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const c = e.course as any;
        return c?.meeting_link;
      }) && (
        <div className="mb-8 space-y-3">
          {activeEnrollments.map((e) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const course = e.course as any;
            if (!course?.meeting_link) return null;
            return (
              <div
                key={e.id}
                className="rounded-2xl p-5 sm:p-6 text-white shadow-sm"
                style={{ background: "linear-gradient(135deg, #5C2D8A 0%, #7B3FB0 100%)" }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-white/70 mb-0.5">Lektionsrum</p>
                      <p className="font-semibold truncate">{course.title}</p>
                      <p className="text-xs text-white/70 mt-1">Klicka för att gå med i Microsoft Teams-mötet.</p>
                    </div>
                  </div>
                  <a
                    href={course.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-white hover:bg-white/90 transition-colors shrink-0"
                    style={{ color: "#7B3FB0" }}
                  >
                    Gå till lektion
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Läxa till nästa lektion */}
      {activeEnrollments.some((e) => {
        const p = progressByCourse.get(e.course_id);
        return p?.homework || p?.last_lesson_summary;
      }) && (
        <div className="mb-8 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h2 className="font-semibold text-gray-900">Läxa till nästa lektion</h2>
          </div>
          {activeEnrollments.map((e) => {
            const p = progressByCourse.get(e.course_id);
            if (!p?.homework && !p?.last_lesson_summary) return null;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const course = e.course as any;
            return (
              <div
                key={e.id}
                className="bg-white rounded-2xl border-2 shadow-sm p-5"
                style={{ borderColor: "#E9D5FF" }}
              >
                <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                  <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ backgroundColor: "#F5EEFF", color: "#7B3FB0" }}>
                    {course?.title ?? "Kurs"}
                  </span>
                  {p.updated_at && (
                    <span className="text-xs text-gray-400">
                      Uppdaterad {new Date(p.updated_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>

                {p.homework && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Din läxa</p>
                    <p className="text-gray-800 leading-relaxed whitespace-pre-line">{p.homework}</p>
                  </div>
                )}

                {p.last_lesson_summary && (
                  <div className={p.homework ? "pt-3 border-t border-gray-100" : ""}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Var slutade vi senast</p>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{p.last_lesson_summary}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Aktiva kurser", value: String(courseIds.length), icon: "📚" },
          { label: "Slutförda lektioner", value: String(completedCount ?? 0), icon: "✅" },
          { label: "Kommande lektioner", value: String(upcomingLessons?.length ?? 0), icon: "📅" },
          { label: "Olästa meddelanden", value: String(unreadCount ?? 0), icon: "💬" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Prenumerationer */}
      {activeEnrollments.length > 0 && (
        <div className="mb-6 space-y-3">
          <h2 className="font-semibold text-gray-900">Mina prenumerationer</h2>
          {activeEnrollments.map((e) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const course = e.course as any;
            return (
              <SubscriptionCard
                key={e.id}
                enrollmentId={e.id}
                courseTitle={course?.title ?? "Okänd kurs"}
                isSubscription={course?.is_subscription ?? false}
                subscriptionStatus={e.subscription_status as string | null}
                currentPeriodEnd={e.current_period_end}
                hasStripeSubscription={!!e.stripe_subscription_id}
              />
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kommande lektioner */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Kommande lektioner</h2>
            <Link href="/portal/schema" className="text-xs font-medium hover:underline" style={{ color: "#7B3FB0" }}>
              Se hela schemat →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!upcomingLessons || upcomingLessons.length === 0 ? (
              <div className="px-6 py-10 text-center text-gray-400 text-sm">
                Inga kommande lektioner inbokade ännu.
              </div>
            ) : (
              upcomingLessons.map((lesson) => {
                const d = lesson.scheduled_at ? new Date(lesson.scheduled_at) : null;
                const end = d ? new Date(d.getTime() + lesson.duration_minutes * 60000) : null;
                const dateStr = d
                  ? d.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })
                  : "–";
                const timeStr = d
                  ? `${d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}–${end!.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}`
                  : "";
                return (
                  <div key={lesson.id} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#F5EEFF" }}>
                      <svg className="w-5 h-5" style={{ color: "#7B3FB0" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{lesson.title}</p>
                      <p className="text-xs text-gray-400">{dateStr} · {timeStr}</p>
                    </div>
                    {lesson.meeting_link && (
                      <a href={lesson.meeting_link} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#F5EEFF", color: "#7B3FB0" }}>
                        Gå med
                      </a>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Snabblänkar + senaste meddelande */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Snabblänkar</h2>
            </div>
            <div className="p-4 space-y-2">
              {[
                { href: "/portal/kurser", label: "Mina kurser" },
                { href: "/portal/material", label: "Lektionsmaterial" },
                { href: "/portal/meddelanden", label: "Meddelanden" },
              ].map((link) => (
                <Link key={link.href} href={link.href}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors">
                  {link.label}
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {latestMessage && (
            <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg, #5C2D8A 0%, #7B3FB0 100%)" }}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">
                  {((latestMessage.sender as { full_name?: string; email?: string } | undefined)?.full_name ??
                    (latestMessage.sender as { full_name?: string; email?: string } | undefined)?.email ?? "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-white/70 mb-1">
                    {(latestMessage.sender as { full_name?: string; email?: string } | undefined)?.full_name ??
                      (latestMessage.sender as { full_name?: string; email?: string } | undefined)?.email} ·{" "}
                    {new Date(latestMessage.created_at).toLocaleDateString("sv-SE")}
                  </p>
                  <p className="text-sm text-white/90 leading-relaxed line-clamp-3">{latestMessage.content}</p>
                </div>
              </div>
              <Link href="/portal/meddelanden" className="mt-4 block text-xs text-white/70 hover:text-white">
                Se alla meddelanden →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
