"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap,  // GANTI UserGraduate dengan GraduationCap
  ClipboardList, 
  BarChart3, 
  CreditCard, 
  Settings 
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/users", label: "Users Sheet", icon: Users },
    { href: "/dashboard/students", label: "Siswa (CRUD)", icon: GraduationCap }, // GANTI DI SINI
    { href: "/dashboard/attendance", label: "Kehadiran", icon: ClipboardList },
    { href: "/dashboard/statistics", label: "Statistik Siswa", icon: BarChart3 },
    { href: "/dashboard/cards", label: "Cetak Kartu Siswa", icon: CreditCard },
    { href: "/dashboard/settings", label: "Pengaturan Sekolah", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900/80 border-r border-slate-800 p-5 flex flex-col">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white">Absensi QR</h1>
            <p className="text-xs text-indigo-400">Admin Web Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-3 transition ${
                isActive
                  ? "text-indigo-400 bg-indigo-950/60 border border-indigo-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-500">
        Backend Next.js + Google Sheets
      </div>
    </aside>
  );
}