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
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Gagal");
        return;
      }
      
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Assign Sekolah ke Siswa</h1>
        <p className="text-slate-400 mb-6">
          Otomatis mengisi kolom School berdasarkan nama kelas (TK/SD/SMP/SMA).
        </p>

        {error && (
          <div className="bg-rose-500/20 border border-rose-400/30 text-rose-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-4 py-3 rounded-lg mb-4">
            <p className="font-bold">Hasil:</p>
            <p>Total siswa: {result.total}</p>
            <p>Yang diupdate: {result.updated}</p>
            {result.message && <p className="mt-2">{result.message}</p>}
            {result.preview && result.preview.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm">Lihat preview ({result.preview.length} siswa)</summary>
                <div className="mt-2 max-h-64 overflow-y-auto bg-black/30 rounded p-3 text-xs font-mono">
                  {result.preview.map((p: any, i: number) => (
                    <div key={i} className="mb-1">
                      Row {p.row}: {p.className} → {p.school}
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
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            {loading ? "Memproses..." : "🔍 Preview (Dry Run)"}
          </button>

          <button
            onClick={() => runAssignment(false)}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            {loading ? "Memproses..." : "✅ Eksekusi (Update Database)"}
          </button>
        </div>

        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-2">Cara kerja:</h3>
          <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
            <li>TK: kelas mengandung "TK"</li>
            <li>SD: kelas 1-6 atau mengandung "SD"</li>
            <li>SMP: kelas VII/VIII/IX atau 7/8/9</li>
            <li>SMA: kelas X/XI/XII atau IPA/IPS</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
