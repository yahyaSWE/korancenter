import type { MaterialRow } from "./types";
import type { Course } from "@/lib/supabase/types";
import { btnPrimary } from "./types";

type Props = {
  materials: MaterialRow[];
  courses: Course[];
  onUpload: () => void;
  onDelete: (id: string, url: string | null) => void;
};

export function MaterialTab({ materials, onUpload, onDelete }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Material ({materials.length} filer)</h2>
        <button onClick={onUpload} className={btnPrimary} style={{ backgroundColor: "#7B3FB0" }}>
          + Ladda upp fil
        </button>
      </div>

      {materials.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
          Inga filer ännu. Ladda upp material som eleverna kan ladda ner.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fil</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Kurs</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Typ</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Storlek</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Uppladdad</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {materials.map((mat) => {
                  const typeIcons: Record<string, string> = { pdf: "📄", video: "🎥", note: "📝", audio: "🎵" };
                  const icon = mat.type ? typeIcons[mat.type] ?? "📎" : "📎";
                  const size = mat.file_size_bytes ? `${(mat.file_size_bytes / (1024 * 1024)).toFixed(1)} MB` : "–";
                  return (
                    <tr key={mat.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{icon}</span>
                          <span className="font-medium text-gray-900 truncate max-w-48">{mat.title}</span>
                        </div>
                        {mat.lesson && <p className="text-xs text-gray-400 mt-0.5 pl-7">{mat.lesson.title}</p>}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{mat.course?.title ?? "–"}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#F5EEFF", color: "#7B3FB0" }}>
                          {mat.type?.toUpperCase() ?? "–"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">{size}</td>
                      <td className="px-6 py-4 text-gray-400 text-xs">{new Date(mat.created_at).toLocaleDateString("sv-SE")}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 justify-end">
                          {mat.url && (
                            <a href={mat.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#7B3FB0] hover:underline">Öppna</a>
                          )}
                          <button onClick={() => onDelete(mat.id, mat.url)} className="text-xs text-gray-400 hover:text-red-500">Ta bort</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
