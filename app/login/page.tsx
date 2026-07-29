"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-center mb-3">
          <img src="/android-chrome-192x192.png" alt="Kastriva Absensi" className="w-16 h-16 rounded-2xl object-contain" />
        </div>
        <h1 className="text-xl font-bold mb-1 text-center">
          {mode === "login" ? "Masuk" : "Daftar Akun"}
        </h1>
        <p className="text-xs text-slate-400 mb-5 text-center">
          Kastriva Absensi · data tetap di Spreadsheet
        </p>

        <form onSubmit={submit} className="space-y-3 text-sm">
          {mode === "register" && (
            <div>
              <label className="block text-slate-400 mb-1">Nama Lengkap</label>
              <input value={form.name} onChange={set("name")} required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 focus:border-indigo-500 focus:outline-none" />
            </div>
          )}
          <div>
            <label className="block text-slate-400 mb-1">Email</label>
            <input type="email" value={form.email} onChange={set("email")} required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Password</label>
            <div className="relative">
              <input type={show ? "text" : "password"} value={form.password} onChange={set("password")} required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 pr-16 focus:border-indigo-500 focus:outline-none" />
              <button type="button" onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 hover:text-white">
                {show ? "sembunyi" : "lihat"}
              </button>
            </div>
            {mode === "register" && (
              <p className="text-[10px] text-slate-500 mt-1">
                Min. 8 karakter: huruf besar, huruf kecil, angka, simbol.
              </p>
            )}
          </div>

          {msg && (
            <div className={"text-xs rounded-lg px-3 py-2 " + (msg.ok ? "bg-emerald-950 text-emerald-300" : "bg-rose-950 text-rose-300")}>
              {msg.text}
            </div>
          )}

          <button disabled={busy}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg py-2 font-semibold">
            {busy ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
          </button>
        </form>

        <button onClick={() => { setMode((m) => (m === "login" ? "register" : "login")); setMsg(null); }}
          className="mt-4 text-xs text-slate-400 hover:text-white block mx-auto">
          {mode === "login" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
        </button>
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
