"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Home, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Reveal } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [showDetail, setShowDetail] = useState(false);
  useEffect(() => { console.error("[Kastriva] runtime error:", error); }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Reveal className="w-full max-w-lg">
        <div className="glass-card p-7 sm:p-9 text-center">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-300 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Ups, ada yang tersandung</h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Halaman ini gagal dimuat. Tenang — data Anda aman. Coba muat ulang, atau kembali ke dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-7">
            <button onClick={reset} className="glass-button px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" /> Coba Lagi
            </button>
            <Link href="/dashboard" className="px-5 py-3 rounded-xl text-sm font-semibold text-slate-200 border border-white/15 hover:bg-white/10 transition flex items-center justify-center gap-2">
              <Home className="w-4 h-4" /> Ke Dashboard
            </Link>
          </div>

          <button onClick={() => setShowDetail((s) => !s)} className="mt-6 text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 mx-auto">
            {showDetail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Detail teknis
          </button>
          {showDetail && (
            <pre className="mt-3 text-left text-[11px] text-rose-200/80 bg-black/30 border border-white/10 rounded-xl p-3 overflow-auto max-h-40 whitespace-pre-wrap break-words">
              {error.message}
              {error.digest ? "\n\ndigest: " + error.digest : ""}
            </pre>
          )}
        </div>
      </Reveal>
    </div>
  );
}
