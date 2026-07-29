"use client";
import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, X, User, Mail, Lock, Shield } from "lucide-react";

interface User {
  UserID: string;
  Email: string;
  Role: string;
  CreatedAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({
    Email: "",
    Password: "",
    Role: "user",
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    
    try {
      const url = editing ? "/api/users" : "/api/users";
      const method = editing ? "PUT" : "POST";
      const body = editing 
        ? { ...form, UserID: editing.UserID }
        : form;
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || "Gagal menyimpan user" });
        return;
      }
      
      setMsg({ ok: true, text: data.message || "Berhasil" });
      setShowForm(false);
      setEditing(null);
      setForm({ Email: "", Password: "", Role: "user" });
      fetchUsers();
      
      setTimeout(() => setMsg(null), 3000);
    } catch (error) {
      setMsg({ ok: false, text: "Terjadi kesalahan" });
    }
  }

  function handleEdit(user: User) {
    setEditing(user);
    setForm({
      Email: user.Email,
      Password: "",
      Role: user.Role,
    });
    setShowForm(true);
  }

  async function handleDelete(userId: string) {
    if (!confirm("Hapus user ini?")) return;
    
    try {
      const res = await fetch(`/api/users?id=${userId}`, { method: "DELETE" });
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || "Gagal menghapus user");
        return;
      }
      
      fetchUsers();
    } catch (error) {
      alert("Terjadi kesalahan");
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-6 md:p-8 bg-slate-950">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Daftar Akun Pengguna</h1>
          <p className="text-sm text-slate-400 mt-1">Manajemen user web</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setForm({ Email: "", Password: "", Role: "user" });
            setShowForm(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Tambah User
        </button>
      </header>

      {msg && (
        <div className={`mb-6 p-4 rounded-lg text-sm ${msg.ok ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-rose-950 text-rose-300 border border-rose-800"}`}>
          {msg.text}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">{editing ? "Edit User" : "Tambah User"}</h2>
              <button onClick={() => { setShowForm(false); setEditing(null); setForm({ Email: "", Password: "", Role: "user" }); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={form.Email}
                    onChange={(e) => setForm({ ...form, Email: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="user@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">{editing ? "Password Baru (kosongkan jika tidak diubah)" : "Password *"}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    value={form.Password}
                    onChange={(e) => setForm({ ...form, Password: e.target.value })}
                    required={!editing}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder={editing ? "••••••••" : "Minimal 8 karakter"}
                  />
                </div>
                {editing && <p className="text-[10px] text-slate-500 mt-1">Kosongkan jika tidak ingin mengubah password</p>}
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Role</label>
                <div className="relative">
                  <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select
                    value={form.Role}
                    onChange={(e) => setForm({ ...form, Role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex-1">
                  {editing ? "Update" : "Simpan"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm({ Email: "", Password: "", Role: "user" }); }} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                  Batal
                </button>
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
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Dibuat</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((user) => (
                <tr key={user.UserID} className="hover:bg-slate-800/50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <span className="font-mono text-indigo-400">{user.Email}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded ${user.Role === "admin" ? "bg-purple-950 text-purple-300" : "bg-slate-800 text-slate-300"}`}>
                      {user.Role}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 text-xs">{new Date(user.CreatedAt).toLocaleDateString("id-ID")}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => handleEdit(user)} className="text-amber-400 hover:text-amber-300 mr-3">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(user.UserID)} className="text-rose-400 hover:text-rose-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    Belum ada user terdaftar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
