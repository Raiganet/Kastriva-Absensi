"use client";
import { useEffect, useState } from "react";

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  async function fetchAttendance() {
    const res = await fetch("/api/attendance");
    setAttendance(await res.json());
    setLoading(false);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen p-6 md:p-8 bg-slate-950">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Riwayat Log Kehadiran</h1>
        <p className="text-sm text-slate-400 mt-1">Semua catatan absensi siswa</p>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">NIS</th>
                <th className="p-3">Nama Siswa</th>
                <th className="p-3">Kelas</th>
                <th className="p-3">Status</th>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Jam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {attendance.map((a) => (
                <tr key={a.ID} className="hover:bg-slate-800/50">
                  <td className="p-3 font-mono text-slate-500">{a.ID}</td>
                  <td className="p-3 font-mono text-indigo-400">{a.Student_ID}</td>
                  <td className="p-3 font-semibold text-white">{a.Student_Name}</td>
                  <td className="p-3">{a.Class_Name}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded ${a.Status === "Masuk" ? "bg-emerald-950 text-emerald-400" : "bg-sky-950 text-sky-300"}`}>
                      {a.Status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">{a.Date_String}</td>
                  <td className="p-3 font-mono text-slate-400">{a.Time_String}</td>
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">Belum ada data kehadiran</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
