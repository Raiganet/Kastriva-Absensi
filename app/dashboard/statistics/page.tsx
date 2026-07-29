"use client";
import { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import { Download, X } from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function StatisticsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [period, setPeriod] = useState("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [studentsRes, attendanceRes] = await Promise.all([
      fetch("/api/students"),
      fetch("/api/attendance"),
    ]);
    setStudents(await studentsRes.json());
    setAttendance(await attendanceRes.json());
  }

  function getPeriodDates() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    if (period === "month") {
      return { start: `${year}-${String(month).padStart(2, "0")}-01`, end: `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}` };
    } else if (period === "ganjil") {
      return { start: "2026-07-01", end: "2026-12-31" };
    } else if (period === "genap") {
      return { start: "2027-01-01", end: "2027-06-30" };
    } else if (period === "year") {
      return { start: "2026-07-01", end: "2027-06-30" };
    } else {
      return { start: customStart, end: customEnd };
    }
  }

  function calculateStats() {
    setLoading(true);
    const { start, end } = getPeriodDates();
    
    let filtered = attendance.filter((a) => {
      const date = a.Date_String;
      if (date < start || date > end) return false;
      if (selectedStudent && a.Student_ID !== selectedStudent) return false;
      return true;
    });

    // Group by day
    const dayMap: any = {};
    filtered.forEach((a) => {
      const date = a.Date_String;
      if (!dayMap[date]) dayMap[date] = { Hadir: false, Sakit: false, Izin: false, Alfa: false };
      const status = a.Status.toLowerCase();
      if (status === "masuk" || status === "pulang" || status === "hadir") dayMap[date].Hadir = true;
      else if (status === "sakit") dayMap[date].Sakit = true;
      else if (status === "izin") dayMap[date].Izin = true;
      else if (status === "alpa" || status === "alpha") dayMap[date].Alfa = true;
    });

    const counts = { Hadir: 0, Sakit: 0, Izin: 0, Alfa: 0 };
    Object.values(dayMap).forEach((day: any) => {
      if (day.Sakit) counts.Sakit++;
      else if (day.Izin) counts.Izin++;
      else if (day.Alfa) counts.Alfa++;
      else if (day.Hadir) counts.Hadir++;
    });

    const total = counts.Hadir + counts.Sakit + counts.Izin + counts.Alfa;
    
    setStats({
      counts,
      total,
      uniqueDays: total,
      percentages: {
        Hadir: total > 0 ? Math.round((counts.Hadir / total) * 100) : 0,
        Sakit: total > 0 ? Math.round((counts.Sakit / total) * 100) : 0,
        Izin: total > 0 ? Math.round((counts.Izin / total) * 100) : 0,
        Alfa: total > 0 ? Math.round((counts.Alfa / total) * 100) : 0,
      },
      records: filtered,
      period: { start, end },
    });
    setLoading(false);
  }

  function exportCSV() {
    if (!stats) return;
    const headers = ["Tanggal", "NIS", "Nama", "Kelas", "Status", "Kategori", "Jam"];
    const rows = stats.records.map((r: any) => [
      r.Date_String,
      r.Student_ID,
      r.Student_Name,
      r.Class_Name,
      r.Status,
      r.Status.toLowerCase() === "masuk" || r.Status.toLowerCase() === "pulang" ? "Hadir" : r.Status,
      r.Time_String,
    ]);
    
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `statistik_${selectedStudent || "semua"}_${stats.period.start}.csv`;
    a.click();
  }

  const chartData = stats ? {
    labels: ["Hadir", "Alfa", "Sakit", "Izin"],
    datasets: [{
      data: [stats.counts.Hadir, stats.counts.Alfa, stats.counts.Sakit, stats.counts.Izin],
      backgroundColor: ["#10B981", "#F43F5E", "#F59E0B", "#0EA5E9"],
      borderColor: "#0f172a",
      borderWidth: 3,
    }],
  } : null;

  return (
    <div className="min-h-screen p-6 md:p-8 bg-slate-950">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Statistik Kehadiran Per Siswa</h1>
        <p className="text-sm text-slate-400 mt-1">Pilih siswa & periode untuk melihat rekap 4 kategori</p>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-400 mb-1">Pilih Siswa</label>
            <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
              <option value="">-- Semua Siswa --</option>
              {students.map((s) => (
                <option key={s.Student_ID} value={s.Student_ID}>{s.Student_Name} ({s.Class_Name})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Periode</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
              <option value="month">Bulan Ini</option>
              <option value="ganjil">Semester Ganjil 2026/2027</option>
              <option value="genap">Semester Genap 2026/2027</option>
              <option value="year">Tahun Ajaran 2026/2027</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={calculateStats} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
              {loading ? "Memuat..." : "Tampilkan"}
            </button>
          </div>
        </div>
        {period === "custom" && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div><label className="block text-xs text-slate-400 mb-1">Tanggal Mulai</label><input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
            <div><label className="block text-xs text-slate-400 mb-1">Tanggal Selesai</label><input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
          </div>
        )}
      </div>

      {stats && (
        <>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <h4 className="text-lg font-bold text-white">{students.find((s) => s.Student_ID === selectedStudent)?.Student_Name || "Semua Siswa"}</h4>
              <p className="text-xs text-slate-400">Periode: {stats.period.start} s.d. {stats.period.end} • Total record: {stats.total}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                <Download className="w-4 h-4" /> Ekspor CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatBox label="Hadir" value={stats.counts.Hadir} percentage={stats.percentages.Hadir} color="emerald" />
            <StatBox label="Alfa" value={stats.counts.Alfa} percentage={stats.percentages.Alfa} color="rose" />
            <StatBox label="Sakit" value={stats.counts.Sakit} percentage={stats.percentages.Sakit} color="amber" />
            <StatBox label="Izin" value={stats.counts.Izin} percentage={stats.percentages.Izin} color="sky" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-white mb-4">Distribusi Kategori</h4>
              <div className="h-56 flex items-center justify-center">
                {chartData && <Pie data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />}
              </div>
            </div>
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-white mb-4">Detail Kehadiran</h4>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800 text-slate-400 uppercase sticky top-0">
                    <tr>
                      <th className="p-3">Tanggal</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Jam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {stats.records.map((r: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-800/50">
                        <td className="p-3 text-slate-300">{r.Date_String}</td>
                        <td className="p-3">{r.Status}</td>
                        <td className="p-3 font-semibold text-emerald-400">{r.Status.toLowerCase() === "masuk" || r.Status.toLowerCase() === "pulang" ? "Hadir" : r.Status}</td>
                        <td className="p-3 font-mono text-slate-400">{r.Time_String}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatBox({ label, value, percentage, color }: any) {
  const colors: any = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    rose: "bg-rose-500/10 text-rose-400",
    amber: "bg-amber-500/10 text-amber-400",
    sky: "bg-sky-500/10 text-sky-400",
  };
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>•</div>
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <h3 className="text-2xl font-bold text-white">{value}</h3>
        </div>
      </div>
      <div className={`text-xs font-mono ${colors[color].split(" ")[1]}`}>{percentage}%</div>
    </div>
  );
}
