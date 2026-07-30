"use client";
import { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import { Download, Search } from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend);

type Cat = "Hadir" | "Sakit" | "Izin" | "Alfa";

interface AttRec {
  ID?: string;
  Student_ID?: string;
  Student_Name?: string;
  Class_Name?: string;
  Status?: string;
  Date_String?: string;
  Time_String?: string;
}

interface Stats {
  counts: Record<Cat, number>;
  total: number;
  totalScan: number;
  percentages: Record<Cat, number>;
  records: AttRec[];
  period: { start: string; end: string };
}

const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function fmtDate(s?: string): string {
  if (!s) return "-";
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return HARI[d.getDay()] + ", " + Number(m[3]) + " " + BULAN[Number(m[2]) - 1] + " " + m[1];
}

function mapToCat(status?: string): Cat {
  const s = (status || "").toLowerCase().trim();
  if (s === "sakit") return "Sakit";
  if (s === "izin") return "Izin";
  if (s === "alpa" || s === "alpha") return "Alfa";
  return "Hadir"; // masuk / pulang / hadir
}

function catClass(c: Cat): string {
  if (c === "Hadir") return "text-emerald-300 bg-emerald-500/15 border-emerald-400/30";
  if (c === "Alfa") return "text-rose-300 bg-rose-500/15 border-rose-400/30";
  if (c === "Sakit") return "text-amber-300 bg-amber-500/15 border-amber-400/30";
  return "text-sky-300 bg-sky-500/15 border-sky-400/30";
}

export default function StatisticsPage() {
  const [students, setStudents] = useState<AttRec[]>([]);
  const [attendance, setAttendance] = useState<AttRec[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [period, setPeriod] = useState("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [sRes, aRes] = await Promise.all([fetch("/api/students"), fetch("/api/attendance")]);
        setStudents(await sRes.json());
        setAttendance(await aRes.json());
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  function getPeriodDates(): { start: string; end: string } {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const p2 = (n: number) => String(n).padStart(2, "0");
    if (period === "month") {
      const last = new Date(y, m, 0).getDate();
      return { start: `${y}-${p2(m)}-01`, end: `${y}-${p2(m)}-${p2(last)}` };
    }
    if (period === "ganjil") return { start: "2026-07-01", end: "2026-12-31" };
    if (period === "genap") return { start: "2027-01-01", end: "2027-06-30" };
    if (period === "year") return { start: "2026-07-01", end: "2027-06-30" };
    return { start: customStart, end: customEnd };
  }

  function calculateStats() {
    setLoading(true);
    const { start, end } = getPeriodDates();

    const filtered = attendance.filter((a) => {
      const date = a.Date_String || "";
      if (!date) return false;
      if (start && date < start) return false;
      if (end && date > end) return false;
      if (selectedStudent && a.Student_ID !== selectedStudent) return false;
      return true;
    });

    // KUNCI PERBAIKAN: group per (siswa + tanggal), bukan per tanggal saja.
    const dayMap: Record<string, Record<Cat, boolean>> = {};
    filtered.forEach((a) => {
      const date = a.Date_String || "";
      const key = (a.Student_ID || "") + "|" + date;
      if (!dayMap[key]) dayMap[key] = { Hadir: false, Sakit: false, Izin: false, Alfa: false };
      dayMap[key][mapToCat(a.Status)] = true;
    });

    const counts: Record<Cat, number> = { Hadir: 0, Sakit: 0, Izin: 0, Alfa: 0 };
    Object.values(dayMap).forEach((d) => {
      if (d.Sakit) counts.Sakit++;
      else if (d.Izin) counts.Izin++;
      else if (d.Alfa) counts.Alfa++;
      else if (d.Hadir) counts.Hadir++;
    });

    const total = counts.Hadir + counts.Sakit + counts.Izin + counts.Alfa;
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

    setStats({
      counts,
      total,
      totalScan: filtered.length,
      percentages: { Hadir: pct(counts.Hadir), Sakit: pct(counts.Sakit), Izin: pct(counts.Izin), Alfa: pct(counts.Alfa) },
      records: filtered,
      period: { start, end },
    });
    setLoading(false);
  }

  function exportCSV() {
    if (!stats) return;
    const headers = ["Tanggal", "NIS", "Nama", "Kelas", "Status", "Kategori", "Jam"];
    const rows = stats.records.map((r) => [
      r.Date_String || "",
      r.Student_ID || "",
      r.Student_Name || "",
      r.Class_Name || "",
      r.Status || "",
      mapToCat(r.Status),
      r.Time_String || "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `statistik_${selectedStudent || "semua"}_${stats.period.start}_${stats.period.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const showIdentity = !selectedStudent;

  const chartData = stats
    ? {
        labels: ["Hadir", "Alfa", "Sakit", "Izin"],
        datasets: [
          {
            data: [stats.counts.Hadir, stats.counts.Alfa, stats.counts.Sakit, stats.counts.Izin],
            backgroundColor: ["#10B981", "#F43F5E", "#F59E0B", "#0EA5E9"],
            borderColor: "rgba(15,23,42,0.6)",
            borderWidth: 3,
          },
        ],
      }
    : null;

  const selectedName = students.find((s) => s.Student_ID === selectedStudent)?.Student_Name;

  return (
    <div className="space-y-6 animate-fadeIn">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Statistik Kehadiran Per Siswa</h1>
        <p className="text-sm text-slate-400 mt-1">Rekap 4 kategori (Hadir, Alfa, Sakit, Izin) per siswa per hari · bisa ekspor CSV</p>
      </header>

      {/* Filter */}
      <div className="glass-card p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-300 mb-1.5 font-medium">Pilih Siswa</label>
            <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="w-full px-3 py-2.5 text-sm">
              <option value="">-- Semua Siswa --</option>
              {students.map((s) => (
                <option key={s.Student_ID} value={s.Student_ID || ""}>
                  {s.Student_Name} ({s.Class_Name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1.5 font-medium">Periode</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full px-3 py-2.5 text-sm">
              <option value="month">Bulan Ini</option>
              <option value="ganjil">Semester Ganjil 2026/2027</option>
              <option value="genap">Semester Genap 2026/2027</option>
              <option value="year">Tahun Ajaran 2026/2027</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={calculateStats} disabled={loading} className="glass-button w-full px-4 py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
              <Search className="w-4 h-4" /> {loading ? "Memuat..." : "Tampilkan"}
            </button>
          </div>
        </div>
        {period === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1.5 font-medium">Tanggal Mulai</label>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-full px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1.5 font-medium">Tanggal Selesai</label>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-full px-3 py-2.5 text-sm" />
            </div>
          </div>
        )}
      </div>

      {stats && (
        <>
          {/* Header hasil */}
          <div className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-lg font-bold text-white truncate">{selectedName || "Semua Siswa"}</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Periode {stats.period.start} s.d. {stats.period.end} • Total scan: <span className="text-slate-200 font-semibold">{stats.totalScan}</span> • Kehadiran: <span className="text-indigo-300 font-semibold">{stats.total}</span> (hari × siswa)
              </p>
            </div>
            <button onClick={exportCSV} className="glass-button px-4 py-2 text-sm font-bold flex items-center gap-2 whitespace-nowrap" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.9), rgba(5,150,105,0.9))" }}>
              <Download className="w-4 h-4" /> Ekspor CSV
            </button>
          </div>

          {/* 4 kartu */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Hadir" value={stats.counts.Hadir} pct={stats.percentages.Hadir} dot="bg-emerald-400" text="text-emerald-300" />
            <StatCard label="Alfa" value={stats.counts.Alfa} pct={stats.percentages.Alfa} dot="bg-rose-400" text="text-rose-300" />
            <StatCard label="Sakit" value={stats.counts.Sakit} pct={stats.percentages.Sakit} dot="bg-amber-400" text="text-amber-300" />
            <StatCard label="Izin" value={stats.counts.Izin} pct={stats.percentages.Izin} dot="bg-sky-400" text="text-sky-300" />
          </div>

          {/* Chart + detail */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card p-5 sm:p-6">
              <h4 className="text-sm font-bold text-white mb-4">Distribusi Kategori</h4>
              <div className="h-56 flex items-center justify-center">
                {chartData && <Pie data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#cbd5e1", font: { size: 11 } } } } }} />}
              </div>
            </div>
            <div className="lg:col-span-2 glass-card p-5 sm:p-6">
              <h4 className="text-sm font-bold text-white mb-4">Detail Kehadiran</h4>
              <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-xl">
                <table className="w-full text-left text-xs sm:text-sm text-slate-300">
                  <thead className="sticky top-0">
                    <tr className="text-slate-400 uppercase text-[10px] sm:text-xs">
                      <th className="p-3">Tanggal</th>
                      {showIdentity && <th className="p-3">NIS</th>}
                      {showIdentity && <th className="p-3">Nama</th>}
                      <th className="p-3">Status</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Jam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats.records.map((r, i) => {
                      const c = mapToCat(r.Status);
                      return (
                        <tr key={i}>
                          <td className="p-3 whitespace-nowrap text-slate-300">{fmtDate(r.Date_String)}</td>
                          {showIdentity && <td className="p-3 font-mono text-indigo-300 whitespace-nowrap">{r.Student_ID}</td>}
                          {showIdentity && <td className="p-3 text-white whitespace-nowrap">{r.Student_Name}</td>}
                          <td className="p-3 whitespace-nowrap">{r.Status}</td>
                          <td className="p-3"><span className={`px-2 py-0.5 rounded-md border text-[10px] sm:text-xs font-semibold ${catClass(c)}`}>{c}</span></td>
                          <td className="p-3 font-mono text-slate-400 whitespace-nowrap">{r.Time_String}</td>
                        </tr>
                      );
                    })}
                    {stats.records.length === 0 && (
                      <tr><td colSpan={showIdentity ? 6 : 4} className="p-6 text-center text-slate-500">Tidak ada data pada periode ini.</td></tr>
                    )}
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

function StatCard({ label, value, pct, dot, text }: { label: string; value: number; pct: number; dot: string; text: string }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-3">
        <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
        <p className="text-xs text-slate-400">{label}</p>
      </div>
      <h3 className="text-3xl font-extrabold text-white mt-2">{value}</h3>
      <p className={`text-xs font-mono mt-1 ${text}`}>{pct}%</p>
    </div>
  );
}
