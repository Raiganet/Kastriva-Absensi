"use client";
import { useEffect, useState } from "react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    // Note: Ini perlu API endpoint baru untuk WebUsers
    // Untuk sekarang, tampilkan placeholder
    setUsers([]);
    setLoading(false);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen p-6 md:p-8 bg-slate-950">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Daftar Akun Pengguna</h1>
        <p className="text-sm text-slate-400 mt-1">Manajemen user web</p>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <p className="text-slate-400 text-sm">Fitur manajemen user akan ditambahkan segera.</p>
        <p className="text-slate-500 text-xs mt-2">User yang terdaftar disimpan di sheet WebUsers.</p>
      </div>
    </div>
  );
}
