import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const typeIcons: Record<string, string> = { pdf: "📄", video: "🎥", note: "📝", audio: "🎵" };
const typeColors: Record<string, { bg: string; text: string }> = {
  pdf:   { bg: "#FEF2F2", text: "#DC2626" },
  video: { bg: "#EFF6FF", text: "#2563EB" },
  note:  { bg: "#F0FDF4", text: "#16A34A" },
  audio: { bg: "#FFF7ED", text: "#EA580C" },
};
const typeLabels: Record<string, string> = { pdf: "PDF", video: "Video", note: "Anteckning", audio: "Ljud" };

type Material = {
  id: string;
  title: string;
  type: string | null;
  url: string | null;
  file_size_bytes: number | null;
  created_at: string;
  course: { title: string } | null;
  lesson: { title: string } | null;
};

function MaterialItem({ m }: { m: Material }) {
  const colors = m.type ? typeColors[m.type] ?? { bg: "#F5F5F5", text: "#666" } : { bg: "#F5F5F5", text: "#666" };
  const icon   = m.type ? typeIcons[m.type]  ?? "📎" : "📎";
  const label  = m.type ? typeLabels[m.type] ?? m.type : "–";
  const size   = m.file_size_bytes ? `${(m.file_size_bytes / (1024 * 1024)).toFixed(1)} MB` : null;
  const date   = new Date(m.created_at).toLocaleDateString("sv-SE");
  const context = m.lesson?.title ?? m.course?.title ?? "";

  return (
    <div className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
      <div className="text-2xl shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.bg, color: colors.text }}>
            {label}
          </span>
          <span className="text-xs text-gray-400">{context ? `${context} · ` : ""}{date}</span>
          {size && <span className="text-xs text-gray-400">{size}</span>}
        </div>
      </div>
      {m.url ? (
        <a href={m.url} target="_blank" rel="noopener noreferrer"
          className="shrink-0 p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
      ) : (
        <div className="shrink-0 w-8" />
      )}
    </div>
  );
}

function MaterialSection({ title, items }: { title: string; items: Material[] }) {
  if (items.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-900">{title} <span className="text-gray-400 font-normal">({items.length})</span></p>
      </div>
      <div className="divide-y divide-gray-50">
        {items.map((m) => <MaterialItem key={m.id} m={m} />)}
      </div>
    </div>
  );
}

export default async function Material() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/logga-in");

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("student_id", user.id)
    .eq("payment_status", "paid");

  const courseIds = enrollments?.map((e) => e.course_id) ?? [];

  const [{ data: courseMaterials }, { data: generalMaterials }] = await Promise.all([
    courseIds.length > 0
      ? supabase
          .from("materials")
          .select("*, course:courses(title), lesson:lessons(title)")
          .in("course_id", courseIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as Material[] }),
    supabase
      .from("materials")
      .select("*, course:courses(title), lesson:lessons(title)")
      .is("course_id", null)
      .order("created_at", { ascending: false }),
  ]);

  const total = (generalMaterials?.length ?? 0) + (courseMaterials?.length ?? 0);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Lektionsmaterial</h1>
        <p className="text-gray-500 mt-1">Filer, videos och anteckningar från dina lektioner.</p>
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">📂</div>
          <h3 className="font-semibold text-gray-900 mb-2">Inget material ännu</h3>
          <p className="text-gray-500 text-sm">Material läggs upp av din lärare inför och efter lektionerna.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <MaterialSection title="🌐 Allmänt material" items={(generalMaterials ?? []) as Material[]} />
          <MaterialSection title="📚 Kursmaterial" items={(courseMaterials ?? []) as Material[]} />
        </div>
      )}
    </div>
  );
}
