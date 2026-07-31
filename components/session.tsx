"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import type { NavItem, School } from "@/lib/rbac";

export interface SessionMeta {
  label: string; short: string; tone: string; accent: string; readOnly: boolean; description: string;
}
export interface SessionData {
  email?: string;
  role: string;
  scope: "all" | "school" | "class";
  school: School;
  schools: School[];
  classes: string[];
  meta: SessionMeta;
  nav: NavItem[];
}

let cache: { p: Promise<SessionData | null> } | null = null;
function fetchSession(): Promise<SessionData | null> {
  if (!cache) {
    cache = {
      p: fetch("/api/me", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => (d && d.ok ? (d as SessionData) : null))
        .catch(() => null),
    };
  }
  return cache.p;
}
export function clearSessionCache() { cache = null; }

const Ctx = createContext<{ data: SessionData | null; loading: boolean }>({ data: null, loading: true });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchSession().then((d) => { setData(d); setLoading(false); });
  }, []);
  return <Ctx.Provider value={{ data, loading }}>{children}</Ctx.Provider>;
}

export function useSession() { return useContext(Ctx); }

export function DashboardGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data, loading } = useSession();

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-slate-300">Memuat sesi…</div>;
  }
  if (!data) return <>{children}</>;

  const allowed =
    pathname === "/dashboard" ||
    pathname === "/dashboard/" ||
    data.nav.some((n) => pathname === n.href || pathname.startsWith(n.href + "/"));

  if (!allowed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="glass-card max-w-md p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-300 grid place-items-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-white">Akses ditolak</h1>
          <p className="text-sm text-slate-400 mt-2">
            Peran Anda (<span className="text-slate-200 font-semibold">{data.meta.label}</span>) tidak memiliki izin untuk halaman ini.
          </p>
          <a href="/dashboard" className="inline-block mt-5 glass-button px-5 py-2.5 rounded-xl text-sm font-bold">Ke Dashboard</a>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
