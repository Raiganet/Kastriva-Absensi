"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, X } from "lucide-react";
import LogoutButton from "../logout-button";

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    Student_ID: "",
    Student_Name: "",
    Class_Name: "",
    Academic_Year: "",
    Parent_Name: "",
    Parent_Phone: "",
    Address: "",
    Photo: "",
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    const res = await fetch("/api/students");
    const data = await res.json();
    setStudents(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setEditing(null);
    setForm({ Student_ID: "", Student_Name: "", Class_Name: "", Academic_Year: "", Parent_Name: "", Parent_Phone: "", Address: "", Photo: "" });
    fetchStudents();
  }

  function handleEdit(student: any) {
    setEditing(student);
    setForm(student);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus siswa ini?")) return;
    await fetch(`/api/students?id=${id}`, { method: "DELETE" });
    fetchStudents();
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen p-6 md:p-8 bg-slate-950">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Kelola Siswa</h1>
          <p className="text-sm text-slate-400 mt-1">Tambah, edit, hapus data siswa</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setEditing(null); setForm({ Student_ID: "", Student_Name: "", Class_Name: "", Academic_Year: "", Parent_Name: "", Parent_Phone: "", Address: "", Photo: "" }); setShowForm(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tambah Siswa
          </button>
          <LogoutButton />
        </div>
      </header>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">{editing ? "Edit Siswa" : "Tambah Siswa"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-400 mb-1">NIS *</label><input value={form.Student_ID} onChange={(e) => setForm({...form, Student_ID: e.target.value})} required className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
                <div><label className="block text-xs text-slate-400 mb-1">Nama Lengkap *</label><input value={form.Student_Name} onChange={(e) => setForm({...form, Student_Name: e.target.value})} required className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-slate-400 mb-1">Kelas</label><input value={form.Class_Name} onChange={(e) => setForm({...form, Class_Name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
                <div><label className="block text-xs text-slate-400 mb-1">Tahun Ajaran</label><input value={form.Academic_Year} onChange={(e) => setForm({...form, Academic_Year: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
              </div>
              <div><label className="block text-xs text-slate-400 mb-1">Nama Orang Tua</label><input value={form.Parent_Name} onChange={(e) => setForm({...form, Parent_Name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
              <div><label className="block text-xs text-slate-400 mb-1">No. HP Orang Tua</label><input value={form.Parent_Phone} onChange={(e) => setForm({...form, Parent_Phone: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
              <div><label className="block text-xs text-slate-400 mb-1">Alamat</label><textarea value={form.Address} onChange={(e) => setForm({...form, Address: e.target.value})} rows={3} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex-1">Simpan</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-3">NIS</th>
                <th className="p-3">Nama</th>
                <th className="p-3">Kelas</th>
                <th className="p-3">Orang Tua</th>
                <th className="p-3">No. HP</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {students.map((s) => (
                <tr key={s.Student_ID} className="hover:bg-slate-800/50">
                  <td className="p-3 font-mono text-indigo-400">{s.Student_ID}</td>
                  <td className="p-3 font-semibold text-white">{s.Student_Name}</td>
                  <td className="p-3">{s.Class_Name}</td>
                  <td className="p-3">{s.Parent_Name}</td>
                  <td className="p-3 font-mono text-slate-400">{s.Parent_Phone}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => handleEdit(s)} className="text-amber-400 hover:text-amber-300 mr-3"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(s.Student_ID)} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
