"use client";
import { useState } from "react";

export default function AssignSchoolsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function runAssignment(dryRun: boolean) {
    setLoading(true);
    setError("");
    setResult(null);
    
    try {
      const res = await fetch("/api/assign-schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Browser otomatis mengirim cookie login Anda di sini!
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Gagal. Pastikan Anda login sebagai Super Admin.");
        return;
      }
      
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <div className="glass-card w-full max-w-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Assign Sekolah ke Siswa</h1>
        <p className="text-slate-400 mb-6 text-sm">
          Otomatis mengisi kolom "School" berdasarkan nama kelas (TK/SD/SMP/SMA).
        </p>

        {error && (
          <div className="bg-rose-500/20 border border-rose-400/30 text-rose-300 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-4 py-3 rounded-lg mb-4 text-sm">
            <p className="font-bold mb-1">✅ Berhasil!</p>
            <p>Total siswa: {result.total}</p>
            <p>Yang diupdate: {result.updated}</p>
            {result.message && <p className="mt-1">{result.message}</p>}
            
            {result.preview && result.preview.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-slate-300 hover:text-white">
                  Lihat preview ({result.preview.length} siswa)
                </summary>
                <div className="mt-2 max-h-48 overflow-y-auto bg-black/30 rounded p-2 text-xs font-mono space-y-1">
                  {result.preview.map((p: any, i: number) => (
                    <div key={i} className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-slate-400">{p.className}</span>
                      <span className="text-emerald-300 font-bold">→ {p.school}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => runAssignment(true)}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
          >
            {loading ? "Memproses..." : "🔍 1. Preview (Dry Run)"}
          </button>

          <button
            onClick={() => runAssignment(false)}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
          >
            {loading ? "Memproses..." : "✅ 2. Eksekusi (Update Database)"}
          </button>
        </div>

        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <h3 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Logika Deteksi:</h3>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li><span className="text-white font-medium">TK:</span> Nama kelas mengandung "TK"</li>
            <li><span className="text-white font-medium">SD:</span> Kelas 1-6 atau mengandung "SD"</li>
            <li><span className="text-white font-medium">SMP:</span> Kelas VII/VIII/IX atau 7/8/9</li>
            <li><span className="text-white font-medium">SMA:</span> Kelas X/XI/XII atau mengandung "IPA"/"IPS"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
