"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X, Sun, Moon } from "lucide-react";

/* ============================== TOAST ============================== */
type ToastType = "success" | "error" | "info" | "warning";
interface ToastItem { id: number; type: ToastType; title?: string; message: string; duration: number; }
interface ToastApi {
  show: (t: { type: ToastType; message: string; title?: string; duration?: number }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}
const ToastCtx = createContext<ToastApi | null>(null);
export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast harus di dalam <ToastProvider>");
  return ctx;
}

const TOAST_META: Record<ToastType, { Icon: typeof CheckCircle2; ring: string; bar: string; icon: string }> = {
  success: { Icon: CheckCircle2, ring: "border-emerald-400/30", bar: "#10b981", icon: "text-emerald-300" },
  error: { Icon: XCircle, ring: "border-rose-400/30", bar: "#f43f5e", icon: "text-rose-300" },
  info: { Icon: Info, ring: "border-sky-400/30", bar: "#0ea5e9", icon: "text-sky-300" },
  warning: { Icon: AlertTriangle, ring: "border-amber-400/30", bar: "#f59e0b", icon: "text-amber-300" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const remove = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const show = useCallback((t: { type: ToastType; message: string; title?: string; duration?: number }) => {
    const id = ++idRef.current;
    const duration = t.duration ?? 4200;
    setToasts((prev) => [...prev, { id, type: t.type, title: t.title, message: t.message, duration }].slice(-4));
    window.setTimeout(() => remove(id), duration);
  }, [remove]);

  const api: ToastApi = {
    show,
    success: (m, title) => show({ type: "success", message: m, title }),
    error: (m, title) => show({ type: "error", message: m, title }),
    info: (m, title) => show({ type: "info", message: m, title }),
    warning: (m, title) => show({ type: "warning", message: m, title }),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-[calc(100vw-2rem)] sm:w-96 pointer-events-none">
        {toasts.map((t) => {
          const m = TOAST_META[t.type];
          return (
            <div key={t.id} className={`toast-enter pointer-events-auto glass-card !rounded-2xl overflow-hidden border ${m.ring} p-0`}>
              <div className="flex items-start gap-3 p-4">
                <m.Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${m.icon}`} />
                <div className="flex-1 min-w-0">
                  {t.title && <p className="text-sm font-bold text-white leading-tight">{t.title}</p>}
                  <p className={`text-sm text-slate-200 ${t.title ? "mt-0.5" : ""}`}>{t.message}</p>
                </div>
                <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-white flex-shrink-0 -mr-1 -mt-1 p-1 rounded-lg hover:bg-white/10" aria-label="Tutup">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="toast-progress mx-3 mb-3" style={{ background: m.bar, animationDuration: t.duration + "ms" }} />
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

/* ============================== CONFIRM ============================== */
interface ConfirmOpts { title?: string; message: string; confirmText?: string; cancelText?: string; tone?: "danger" | "primary"; }
type ConfirmFn = (opts: ConfirmOpts) => Promise<boolean>;
const ConfirmCtx = createContext<ConfirmFn | null>(null);
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error("useConfirm harus di dalam <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; opts: ConfirmOpts | null; resolve: (v: boolean) => void }>({
    open: false, opts: null, resolve: () => {},
  });
  const confirm: ConfirmFn = useCallback((opts) => {
    return new Promise<boolean>((resolve) => setState({ open: true, opts, resolve }));
  }, []);
  const close = (v: boolean) => { state.resolve(v); setState((s) => ({ ...s, open: false })); };
  const o = state.opts;
  const danger = o?.tone === "danger";

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state.open && o && (
        <div className="modal-overlay fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => close(false)}>
          <div className="modal-panel glass-card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="flex items-start gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? "bg-rose-500/15 text-rose-300" : "bg-indigo-500/15 text-indigo-300"}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-white">{o.title || "Konfirmasi"}</h3>
                <p className="text-sm text-slate-300 mt-1 leading-relaxed">{o.message}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => close(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-200 border border-white/15 hover:bg-white/10 transition">
                {o.cancelText || "Batal"}
              </button>
              <button
                onClick={() => close(true)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition active:scale-95 ${danger ? "bg-gradient-to-r from-rose-500 to-rose-600 shadow-lg shadow-rose-500/30 hover:brightness-110" : "glass-button"}`}
              >
                {o.confirmText || "Ya, lanjutkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}

/* ============================== REVEAL ============================== */
export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={"reveal " + (visible ? "is-visible " : "") + className} style={{ transitionDelay: delay + "ms" }}>
      {children}
    </div>
  );
}

/* ============================== THEME TOGGLE ============================== */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  useEffect(() => {
    const cur = (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "dark";
    setTheme(cur);
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("kastriva-theme", next); } catch {}
    setTheme(next);
  };
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      title={isDark ? "Mode terang" : "Mode gelap"}
      className={"relative grid place-items-center w-10 h-10 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white transition active:scale-95 " + className}
    >
      <Sun className={"w-[18px] h-[18px] absolute transition-all duration-300 " + (isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100 text-amber-300")} />
      <Moon className={"w-[18px] h-[18px] absolute transition-all duration-300 " + (isDark ? "opacity-100 rotate-0 scale-100 text-indigo-200" : "opacity-0 -rotate-90 scale-50")} />
    </button>
  );
}
