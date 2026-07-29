"use client";
import { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import { Users, UserCheck, UserX, LogOut } from "lucide-react";
import LogoutButton from "./logout-button";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function DashboardPage() {
  const [data, setData] = useState({
    students: [],
    attendance: [],
    settings: { school_name: "Sistem Absensi Digital" },
    loading: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [studentsRes, attendanceRes, settingsRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/attendance"),
        fetch("/api/settings"),
      ]);
      
      const students = await studentsRes.json();
      const attendance = await attendanceRes.json();
      const settings = await settingsRes.json();

      const today = new Date().toLocaleDateString("sv-SE");
      const hadirToday = new Set(
        attendance.filter((a: any) => a.Date_String === today).map((a: any) => a.Student_ID)
      );

      setData({ students, attendance, settings, loading: false });

      // Hitung statistik per kelas
      const classStats: any = {};
      students.forEach((s: any) => {
        const cls = s.Class_Name;
        if (!classStats[cls]) {
          classStats[cls] = { total: 0, hadir: 0 };
        }
        classStats[cls].total++;
        if (hadirToday.has(s.Student_ID)) {
          classStats[cls].hadir++;
        }
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      setData((prev) => ({ ...prev, loading: false }));
    }
  }

  if (data.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("sv-SE");
  const hadirToday = new Set(
    data.attendance.filter((a: any) => a.Date_String === today).map((a: any) => a.Student_ID)
  );

  const totalSiswa = data.students.length;
  const hadir = hadirToday.size;
  const belum = totalSiswa - hadir;

  // Data untuk chart
  const pieData = {
    labels: ["Hadir", "Belum Absen"],
    datasets: [
      {
        data: [hadir, belum],
        backgroundColor: ["#10B981", "#F59E0B"],
        borderColor: ["#059669", "#D97706"],
        borderWidth: 2,
      },
    ],
  };

  // Hitung statistik per kelas untuk bar chart
  const classStats: any = {};
  data.students.forEach((s: any) => {
    const cls = s.Class_Name;
    if (!classStats[cls]) {
      classStats[cls] = { total: 0, hadir: 0 };
    }
    classStats[cls].total++;
    if (hadirToday.has(s.Student_ID)) {
      classStats[cls].hadir++;
    }
  });

  const barData = {
    labels: Object.keys(classStats),
    datasets: [
      {
        label: "Hadir",
        data: Object.values(classStats).map((s: any) => s.hadir),
        backgroundColor: "#10B981",
      },
      {
        label: "Belum",
        data: Object.values(classStats).map((s: any) => s.total - s.hadir),
        backgroundColor: "#F59E0B",
      },
    ],
  };

  return (
    <div className="min-h-screen p-6 md:p-8 bg-slate-950">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">{data.settings.school_name}</h1>
          <p className="text-sm text-slate-400 mt-1">Dashboard · Terhubung ke Spreadsheet</p>
        </div>
        <LogoutButton />
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard icon={<UserCheck className="w-6 h-6" />} label="Hadir Hari Ini" value={hadir} color="emerald" sub={`${totalSiswa} siswa`} />
        <StatCard icon={<Users className="w-6 h-6" />} label="Total Siswa" value={totalSiswa} color="blue" />
        <StatCard icon={<UserX className="w-6 h-6" />} label="Belum Absen" value={belum} color="amber" />
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Total Log Absensi</p>
            <h3 className="text-2xl font-bold text-white">{data.attendance.length}</h3>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Kehadiran Global Hari Ini</h3>
          <div className="h-64 flex items-center justify-center">
            <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Kehadiran Per Kelas</h3>
          <div className="h-64">
            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Ringkasan Per Kelas */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Ringkasan Per Kelas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(classStats).map(([className, stats]: [string, any]) => {
            const percentage = Math.round((stats.hadir / stats.total) * 100) || 0;
            return (
              <div key={className} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white">{className}</span>
                  <span className="text-xs text-amber-400">{percentage}%</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {stats.hadir} <span className="text-sm text-slate-400 font-normal">/ {stats.total} hadir</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-400">✓ {stats.hadir} absen</span>
                  <span className="text-amber-400">• {stats.total - stats.hadir} belum</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabel Siswa */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Data Siswa (dari Spreadsheet)</h3>
          <a href="/dashboard/students" className="text-xs text-indigo-400 hover:text-indigo-300">
            Kelola Siswa →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-3 rounded-tl-lg">NIS</th>
                <th className="p-3">Nama</th>
                <th className="p-3">Kelas</th>
                <th className="p-3 rounded-tr-lg">Status Hari Ini</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.students.slice(0, 10).map((s: any) => (
                <tr key={s.Student_ID} className="hover:bg-slate-800/50">
                  <td className="p-3 font-mono text-indigo-400">{s.Student_ID}</td>
                  <td className="p-3 font-semibold text-white">{s.Student_Name}</td>
                  <td className="p-3">{s.Class_Name}</td>
                  <td className="p-3">
                    {hadirToday.has(s.Student_ID) ? (
                      <span className="text-emerald-400 text-xs">✓ Hadir</span>
                    ) : (
                      <span className="text-amber-400 text-xs">• Belum</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.students.length === 0 && (
            <div className="text-center text-slate-500 py-8">Belum ada data siswa</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, sub }: any) {
  const colors: any = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    blue: "bg-blue-500/10 text-blue-400",
    amber: "bg-amber-500/10 text-amber-400",
  };
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <h3 className="text-2xl font-bold text-white">{value}</h3>
        {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}
