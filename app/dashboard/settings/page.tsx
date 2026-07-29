"use client";
import { useEffect, useState, useRef } from "react";
import { Save, Upload, Trash2, Palette } from "lucide-react";

const THEMES = [
  { id: "navy", name: "Navy Royal", front: "radial-gradient(120% 80% at 50% -10%, #16407e 0%, #0c2c5e 42%, #081d40 100%)", accent: "#f5c542" },
  { id: "emerald", name: "Emerald Campus", front: "radial-gradient(120% 80% at 50% -10%, #0f5132 0%, #0b3d27 42%, #07271a 100%)", accent: "#fbbf24" },
  { id: "maroon", name: "Maroon Scholar", front: "radial-gradient(120% 80% at 50% -10%, #6b1f2a 0%, #4d141d 42%, #320c13 100%)", accent: "#f4c06a" },
  { id: "slate", name: "Slate Steel", front: "radial-gradient(120% 80% at 50% -10%, #334155 0%, #1f2937 42%, #0f172a 100%)", accent: "#e2e8f0" },
  { id: "teal", name: "Teal Ocean", front: "radial-gradient(120% 80% at 50% -10%, #0e4f57 0%, #0a3a40 42%, #06262a 100%)", accent: "#5eead4" },
  { id: "cocoa", name: "Cocoa Classic", front: "radial-gradient(120% 80% at 50% -10%, #4a2c1a 0%, #341e12 42%, #21130b 100%)", accent: "#e8b06a" },
  { id: "whiteRed", name: "Putih-Merah", front: "linear-gradient(180deg, #991b1b 0%, #dc2626 18%, #ffffff 27%, #ffffff 72%, #dc2626 82%, #991b1b 100%)", accent: "#b91c1c" },
  { id: "whiteBlue", name: "Putih-Biru", front: "linear-gradient(180deg, #1e3a8a 0%, #2563eb 18%, #ffffff 27%, #ffffff 72%, #2563eb 82%, #1e3a8a 100%)", accent: "#1d4ed8" },
  { id: "whiteGrey", name: "Putih-Abu", front: "linear-gradient(180deg, #334155 0%, #64748b 18%, #ffffff 27%, #ffffff 72%, #64748b 82%, #334155 100%)", accent: "#475569" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [pendingLogo, setPendingLogo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data);
      if (data.logo_url) setLogoPreview(data.logo_url);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body = {
        ...settings,
        logo_url: pendingLogo || settings.logo_url || "",
      };
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        alert("Pengaturan berhasil disimpan!");
        setPendingLogo(null);
        fetchSettings();
      } else {
        alert("Gagal menyimpan pengaturan.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert("Ukuran file terlalu besar (maks 4MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPendingLogo(result);
      setLogoPreview(result);
    };
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setPendingLogo("");
    setLogoPreview(null);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen p-6 md:p-8 bg-slate-950">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Pengaturan Sekolah</h1>
        <p className="text-sm text-slate-400 mt-1">Atur identitas sekolah & tampilan kartu</p>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-3xl space-y-6">
        {/* Identitas Sekolah */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nama Sekolah</label>
            <input
              value={settings.school_name || ""}
              onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="SMA NEGERI 1 DIGITAL"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Tagline / Motto Sekolah</label>
            <input
              value={settings.school_tagline || ""}
              onChange={(e) => setSettings({ ...settings, school_tagline: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="SEKOLAH UNGGUL BERBASIS NILAI"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Website Sekolah</label>
            <input
              value={settings.school_website || ""}
              onChange={(e) => setSettings({ ...settings, school_website: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="https://sekolah.sch.id"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nama Kepala Sekolah</label>
            <input
              value={settings.principal_name || ""}
              onChange={(e) => setSettings({ ...settings, principal_name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="Dr. H. Supriyadi, M.Pd"
            />
          </div>
        </div>

        {/* Pemilih Tema */}
        <div className="border-t border-slate-800 pt-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
            <Palette className="w-4 h-4 text-indigo-400" />
            Latar Kartu Siswa
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {THEMES.map((theme) => {
              const isActive = settings.card_bg_preset === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setSettings({ ...settings, card_bg_preset: theme.id })}
                  className={`relative rounded-lg overflow-hidden border-2 transition ${
                    isActive ? "border-white shadow-lg" : "border-slate-700 hover:border-slate-500"
                  }`}
                  style={{ height: "50px", background: theme.front }}
                  title={theme.name}
                >
                  <div
                    className="absolute bottom-1 right-1 w-3 h-3 rounded-full"
                    style={{ background: theme.accent, boxShadow: "0 0 0 1px rgba(0,0,0,.4)" }}
                  />
                  <div className="absolute bottom-1 left-1 text-[8px] font-bold text-white drop-shadow">
                    {theme.name.split(" ")[0]}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            Tema aktif: <span className="text-slate-300 font-semibold">{THEMES.find(t => t.id === settings.card_bg_preset)?.name || "Navy Royal"}</span>
          </p>
        </div>

        {/* Upload Logo */}
        <div className="border-t border-slate-800 pt-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
            <Upload className="w-4 h-4 text-indigo-400" />
            Logo Sekolah
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 hover:bg-slate-800/50 transition"
          >
            <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
            <p className="text-sm text-slate-300 font-semibold">Klik atau seret file logo ke sini</p>
            <p className="text-xs text-slate-500 mt-1">PNG transparan disarankan • maks 4MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>

          {logoPreview && (
            <div className="mt-4 flex items-center gap-3 bg-slate-950 border border-slate-700 rounded-xl p-3">
              <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center p-1 flex-shrink-0">
                <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200">
                  {pendingLogo ? "Logo baru (belum disimpan)" : "Logo tersimpan"}
                </p>
                <p className="text-xs text-slate-500 truncate">Aktif di semua kartu siswa</p>
              </div>
              <button
                onClick={removeLogo}
                className="text-rose-400 hover:text-rose-300 text-xs flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> Hapus
              </button>
            </div>
          )}
        </div>

        {/* Tombol Simpan */}
        <div className="border-t border-slate-800 pt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-6 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </div>
    </div>
  );
}