// =====================================================================
//  KASTRIVA · RBAC  —  satu sumber kebenaran kebijakan peran
//  Murni TypeScript (tanpa import runtime) -> aman di Edge & Client.
//  Semua lapisan B (middleware, route handler, sidebar, badge) membaca
//  dari sini. Tidak ada "if role === 'admin'" tersebar di tempat lain.
// =====================================================================

// ---- Peran -----------------------------------------------------------
export type Role = "super_admin" | "admin" | "kepsek" | "wali_kelas";
export const ROLES: readonly Role[] = ["super_admin", "admin", "kepsek", "wali_kelas"];

// ---- Aksi atomik -----------------------------------------------------
export type Action =
  | "view_dashboard"
  | "view_students"   | "manage_students"
  | "view_users"      | "manage_users"
  | "view_attendance"
  | "view_statistics"
  | "print_cards"
  | "view_settings"   | "manage_settings"
  | "manage_self";

export const ALL_ACTIONS: readonly Action[] = [
  "view_dashboard",
  "view_students", "manage_students",
  "view_users", "manage_users",
  "view_attendance",
  "view_statistics",
  "print_cards",
  "view_settings", "manage_settings",
  "manage_self",
];

// ---- Matriks kebijakan ----------------------------------------------
//  super_admin & admin  : penuh.
//  kepsek               : baca semua + cetak + ubah sandi sendiri (read-only thd data).
//  wali_kelas           : baca ruang lingkupnya (row-level ditegakkan di B-3) + sandi sendiri.
const FULL: readonly Action[] = ALL_ACTIONS;
const READ_ONLY_SCOPE: readonly Action[] = [
  "view_dashboard", "view_students", "view_attendance",
  "view_statistics", "print_cards", "view_settings", "manage_self",
];
const WALI_SCOPE: readonly Action[] = [
  "view_dashboard", "view_students", "view_attendance",
  "view_statistics", "print_cards", "manage_self",
];

export const POLICY: Record<Role, readonly Action[]> = {
  super_admin: FULL,
  admin: FULL,
  kepsek: READ_ONLY_SCOPE,
  wali_kelas: WALI_SCOPE,
};

// ---- Metadata tampilan per peran ------------------------------------
//  `icon` disimpan sebagai NAMA (string) supaya file ini tetap bebas
//  dependensi; lapisan UI yang memetakan string -> komponen lucide.
export interface RoleMeta {
  label: string;
  short: string;
  description: string;
  icon: string;                 // nama ikon lucide
  tone: string;                 // kelas tailwind untuk pill/badge
  accent: string;               // hex untuk dot / chart
  readOnly: boolean;
  level: number;                // pangkat (bukan wewenang tulis): super>admin>kepsek>wali
}

export const ROLE_META: Record<Role, RoleMeta> = {
  super_admin: {
    label: "Super Admin", short: "SA", icon: "ShieldCheck",
    description: "Akses penuh lintas sekolah; tidak dapat diturunkan atau dihapus oleh admin.",
    tone: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/30",
    accent: "#d946ef", readOnly: false, level: 4,
  },
  admin: {
    label: "Administrator", short: "AD", icon: "Shield",
    description: "Akses penuh: kelola siswa, pengguna, pengaturan, dan laporan.",
    tone: "bg-indigo-500/15 text-indigo-300 border-indigo-400/30",
    accent: "#6366f1", readOnly: false, level: 3,
  },
  kepsek: {
    label: "Kepala Sekolah", short: "KS", icon: "Eye",
    description: "Pantau seluruh kehadiran & laporan; tidak dapat mengubah data.",
    tone: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
    accent: "#10b981", readOnly: true, level: 2,
  },
  wali_kelas: {
    label: "Wali Kelas", short: "WK", icon: "Users",
    description: "Melihat & memantau kelas binaannya saja (ruang lingkup ditegakkan server).",
    tone: "bg-sky-500/15 text-sky-300 border-sky-400/30",
    accent: "#0ea5e9", readOnly: true, level: 1,
  },
};

// ---- Normalisasi peran dari data tersimpan --------------------------
//  "user" (warisan) & nilai tak dikenal -> "admin" selama transisi,
//  agar tidak ada akun existing yang terkunci saat pagar dinyalakan.
//  TODO(B-3): setelah peran ditata, pertimbangkan fail-closed untuk unknown.
export function normalizeRole(raw: unknown): Role {
  const r = (raw ?? "").toString().trim().toLowerCase();
  if (r === "super_admin") return "super_admin";
  if (r === "admin" || r === "user" || r === "") return "admin";
  if (r === "kepsek") return "kepsek";
  if (r === "wali_kelas") return "wali_kelas";
  return "admin";
}

// ---- Mesin keputusan -------------------------------------------------
export function can(role: Role | string | undefined, action: Action): boolean {
  return POLICY[normalizeRole(role)].includes(action);
}
export function canAny(role: Role | string | undefined, actions: readonly Action[]): boolean {
  return actions.some((a) => can(role, a));
}
export function canAll(role: Role | string | undefined, actions: readonly Action[]): boolean {
  return actions.every((a) => can(role, a));
}
export function isAtLeast(role: Role | string | undefined, min: Role): boolean {
  return ROLE_META[normalizeRole(role)].level >= ROLE_META[min].level;
}
export function isReadOnly(role: Role | string | undefined): boolean {
  return ROLE_META[normalizeRole(role)].readOnly;
}
export function roleMeta(role: Role | string | undefined): RoleMeta {
  return ROLE_META[normalizeRole(role)];
}

// Melempar bila tidak berwenang — dipakai route handler agar konsisten.
export function assertCan(role: Role | string | undefined, action: Action): void {
  if (!can(role, action)) {
    const e = new Error(`Akses ditolak: peran '${normalizeRole(role)}' tidak memiliki '${action}'.`);
    (e as Error & { status?: number }).status = 403;
    throw e;
  }
}

// ---- Menu navigasi = data, dengan gerbang aksi ----------------------
//  Sidebar & proteksi rute berdua membaca daftar ini. Tambah menu =
//  tambah satu baris di sini, bukan menyebar di banyak file.
export interface NavItem {
  href: string;
  label: string;
  icon: string;                 // nama ikon lucide
  gate: Action;                 // aksi minimal untuk MELIHAT menu ini
}
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard",            label: "Dashboard",          icon: "LayoutDashboard", gate: "view_dashboard" },
  { href: "/dashboard/users",      label: "Users Sheet",        icon: "Users",           gate: "view_users" },
  { href: "/dashboard/students",   label: "Siswa (CRUD)",       icon: "GraduationCap",   gate: "view_students" },
  { href: "/dashboard/attendance", label: "Kehadiran",          icon: "ClipboardList",   gate: "view_attendance" },
  { href: "/dashboard/statistics", label: "Statistik Siswa",    icon: "BarChart3",       gate: "view_statistics" },
  { href: "/dashboard/cards",      label: "Cetak Kartu Siswa",  icon: "CreditCard",      gate: "print_cards" },
  { href: "/dashboard/settings",   label: "Pengaturan Sekolah", icon: "Settings",        gate: "view_settings" },
];
export function visibleNav(role: Role | string | undefined): NavItem[] {
  return NAV_ITEMS.filter((i) => can(role, i.gate));
}

// ---- Opsi peran untuk dropdown (UI manajemen user) ------------------
//  `availableNow` = boleh ditawarkan di dropdown SEKARANG.
//  wali_kelas menunggu pemetaan guru->kelas (B-3); super_admin via seed.
export interface RoleOption { value: Role; label: string; description: string; availableNow: boolean; }
export const ROLE_OPTIONS: readonly RoleOption[] = [
  { value: "admin",      label: ROLE_META.admin.label,      description: ROLE_META.admin.description,      availableNow: true },
  { value: "kepsek",     label: ROLE_META.kepsek.label,     description: ROLE_META.kepsek.description,     availableNow: true },
  { value: "wali_kelas", label: ROLE_META.wali_kelas.label, description: ROLE_META.wali_kelas.description, availableNow: false },
  { value: "super_admin",label: ROLE_META.super_admin.label,description: ROLE_META.super_admin.description,availableNow: false },
];
