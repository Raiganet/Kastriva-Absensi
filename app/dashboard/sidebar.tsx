"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardList,
  BarChart3,
  CreditCard,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/users", label: "Users Sheet", icon: Users },
    { href: "/dashboard/students", label: "Siswa (CRUD)", icon: GraduationCap },
    { href: "/dashboard/attendance", label: "Kehadiran", icon: ClipboardList },
    { href: "/dashboard/statistics", label: "Statistik Siswa", icon: BarChart3 },
    { href: "/dashboard/cards", label: "Cetak Kartu Siswa", icon: CreditCard },
    { href: "/dashboard/settings", label: "Pengaturan Sekolah", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 glass-button p-3 rounded-xl"
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={ixed lg:static inset-y-0 left-0 z-40 w-64 glass transform transition-transform duration-300 ease-in-out }
      >
        <div className="p-5 flex flex-col h-full">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <img src="/android-chrome-192x192.png" alt="Kastriva Absensi" className="w-10 h-10 rounded-xl object-contain" />
              <div>
                <h1 className="font-bold text-base text-white">Kastriva Absensi</h1>
                <p className="text-xs text-indigo-400">Admin Dashboard</p>
              </div>
            </div>
          </div>

          <nav className="space-y-1 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={w-full text-left px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-3 transition }
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-white/10 text-[11px] text-slate-500">
            Kastriva Absensi · Next.js + Google Sheets
          </div>
        </div>
      </aside>
    </>
  );
}
