import type { WaitlistRow } from "./types";

type Props = {
  waitlist: WaitlistRow[];
  onDelete: (id: string, name: string) => void;
};

export function WaitlistTab({ waitlist, onDelete }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Intressekö ({waitlist.length})</h2>
        <p className="text-sm text-gray-400">Personer som anmält intresse för fullbokade kurser.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Datum</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Kurs</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Namn</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">E-post / Telefon</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nivå</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {waitlist.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">Ingen i kön ännu.</td></tr>
              ) : waitlist.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                    {new Date(w.created_at).toLocaleDateString("sv-SE")}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#F5EEFF", color: "#7B3FB0" }}>
                      {w.course?.title ?? "–"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{w.name}</td>
                  <td className="px-6 py-4">
                    <div className="text-gray-600">{w.email}</div>
                    <div className="text-gray-400 text-xs">{w.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs max-w-xs">
                    {w.level_description ?? <span className="italic text-gray-300">Ej angivet</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onDelete(w.id, w.name)} className="text-xs text-gray-400 hover:text-red-500">
                      Ta bort
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
