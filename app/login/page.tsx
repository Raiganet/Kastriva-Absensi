"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/" + mode, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMsg({ ok: false, text: data.error || "Gagal." });
        return;
      }
      setMsg({ ok: true, text: data.message || "Berhasil." });
      if (mode === "login") router.push(params.get("from") || "/dashboard");
    } catch {
      setMsg({ ok: false, text: "Tidak dapat terhubung ke server." });
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="glass-card w-full max-w-md p-6 sm:p-8 animate-fadeIn">
        <div className="flex justify-center mb-4">
          <img src="/android-chrome-192x192.png" alt="Kastriva Absensi" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-contain" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          {mode === "login" ? "Selamat Datang" : "Buat Akun"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mb-6 text-center">
          Kastriva Absensi · Sistem Absensi Digital
        </p>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-xs sm:text-sm text-slate-300 mb-2">Nama Lengkap</label>
              <input
                value={form.name}
                onChange={set("name")}
                required
                className="glass-input w-full px-4 py-3 text-white text-sm sm:text-base"
                placeholder="Masukkan nama lengkap"
              />
            </div>
          )}
          <div>
            <label className="block text-xs sm:text-sm text-slate-300 mb-2">Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                required
                className="glass-input w-full pl-11 pr-4 py-3 text-white text-sm sm:text-base"
                placeholder="email@sekolah.sch.id"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-slate-300 mb-2">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={show ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                required
                className="glass-input w-full pl-11 pr-12 py-3 text-white text-sm sm:text-base"
                placeholder="Minimal 8 karakter"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {mode === "register" && (
              <p className="text-[10px] sm:text-xs text-slate-500 mt-2">
                Min. 8 karakter: huruf besar, huruf kecil, angka, simbol.
              </p>
            )}
          </div>

          {msg && (
            <div className={	ext-xs sm:text-sm rounded-lg px-4 py-3 flex items-start gap-2 }>
              <span>{msg.text}</span>
            </div>
          )}

          <button
            disabled={busy}
            className="glass-button w-full py-3 text-white font-semibold text-sm sm:text-base disabled:opacity-50"
          >
            {busy ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={() => {
              setMode((m) => (m === "login" ? "register" : "login"));
              setMsg(null);
            }}
            className="text-xs sm:text-sm text-slate-400 hover:text-white transition"
          >
            {mode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
          </button>
          {mode === "login" && (
            <a href="/forgot-password" className="text-xs sm:text-sm text-indigo-400 hover:text-indigo-300 transition">
              Lupa password?
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
