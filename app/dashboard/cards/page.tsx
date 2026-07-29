"use client";
import { useEffect, useState } from "react";
import { Printer, RefreshCw } from "lucide-react";

export default function CardsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [studentsRes, settingsRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/settings"),
      ]);
      setStudents(await studentsRes.json());
      setSettings(await settingsRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Tentukan tema warna dari settings
  const theme = getTheme(settings.card_bg_preset || "navy");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8 bg-slate-950">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Generate & Cetak Kartu Siswa</h1>
          <p className="text-sm text-slate-400 mt-1">
            Format portrait ukuran KTP (5,5 × 9 cm). Saat mencetak pilih <b>Scale 100%</b> & centang <b>Background graphics</b>.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => window.print()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Cetak Kartu Massal
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map((student) => (
          <Card
            key={student.Student_ID}
            student={student}
            settings={settings}
            theme={theme}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// Komponen Kartu
// ============================================
function Card({ student, settings, theme }: any) {
  const hasPhoto = student.Photo && student.Photo.startsWith("data:image");
  const hasLogo = settings.logo_url && settings.logo_url.startsWith("data:image");
  const schoolName = settings.school_name || "SMA NEGERI 1";
  const tagline = settings.school_tagline || "SEKOLAH UNGGUL BERBASIS NILAI";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(student.Student_ID || "")}`;

  return (
    <div
      className="rounded-xl overflow-hidden shadow-2xl print:shadow-none"
      style={{
        width: "5.5cm",
        height: "9cm",
        background: theme.front,
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      {/* Glow effect */}
      <div
        style={{
          position: "absolute",
          top: "-30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "140%",
          height: "60%",
          background: `radial-gradient(closest-side, ${theme.accent}33, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "7px 8px 23px",
          boxSizing: "border-box",
          textAlign: "center",
        }}
      >
        {/* Header: Logo + Nama Sekolah */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px", width: "100%", marginBottom: "4px" }}>
          <div
            style={{
              width: "21px",
              height: "21px",
              borderRadius: "50%",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: `0 0 0 1.5px ${theme.accent}`,
              overflow: "hidden",
            }}
          >
            {hasLogo ? (
              <img src={settings.logo_url} style={{ width: "100%", height: "100%", objectFit: "contain" }} alt="logo" />
            ) : (
              <span style={{ color: "#0c2c5e", fontSize: "10px", fontWeight: 800 }}>🏫</span>
            )}
          </div>
          <div style={{ textAlign: "left", lineHeight: 1.05, minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: "8px",
                letterSpacing: "0.2px",
                textTransform: "uppercase",
                color: "#fff",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {schoolName}
            </div>
            <div
              style={{
                fontSize: "4.6px",
                letterSpacing: "1.1px",
                textTransform: "uppercase",
                color: theme.accent,
                fontWeight: 600,
                marginTop: "1px",
              }}
            >
              {tagline}
            </div>
          </div>
        </div>

        {/* Garis pemisah */}
        <div
          style={{
            width: "100%",
            height: "1px",
            background: `linear-gradient(90deg, transparent, ${theme.accent}b3, transparent)`,
            margin: "4px 0 2px",
          }}
        />

        {/* Foto Siswa */}
        <div style={{ marginTop: "2px" }}>
          <div
            style={{
              width: "62px",
              height: "62px",
              borderRadius: "50%",
              padding: "2.5px",
              background: `linear-gradient(145deg, ${theme.accent}, ${theme.accent2})`,
              boxShadow: "0 6px 16px -4px rgba(0,0,0,.5)",
              boxSizing: "border-box",
            }}
          >
            {hasPhoto ? (
              <img
                src={student.Photo}
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", display: "block", background: "#e8eef7" }}
                alt="foto"
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: "#e8eef7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#7d8aa0",
                  fontSize: "24px",
                  fontWeight: 700,
                  border: "2px solid #fff",
                  boxSizing: "border-box",
                }}
              >
                {(student.Student_Name || "?").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Nama Siswa */}
        <div
          style={{
            fontWeight: 800,
            fontSize: "11px",
            letterSpacing: "0.3px",
            textTransform: "uppercase",
            marginTop: "5px",
            lineHeight: 1.05,
            textShadow: "0 1px 3px rgba(0,0,0,.4)",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: "#fff",
          }}
        >
          {student.Student_Name || "-"}
        </div>

        {/* Pill NIS */}
        <div
          style={{
            marginTop: "3px",
            background: `linear-gradient(90deg, ${theme.pill1}, ${theme.pill2})`,
            color: "#fff",
            fontFamily: "ui-monospace, monospace",
            fontWeight: 700,
            fontSize: "7.5px",
            letterSpacing: "1px",
            padding: "2px 10px",
            borderRadius: "999px",
            boxShadow: "0 2px 6px rgba(0,0,0,.3)",
          }}
        >
          {student.Student_ID || "-"}
        </div>

        {/* Kelas */}
        <div style={{ marginTop: "5px" }}>
          <div style={{ fontSize: "5px", letterSpacing: "1.4px", textTransform: "uppercase", color: "#9fb6da", fontWeight: 600 }}>
            KELAS
          </div>
          <div
            style={{
              fontWeight: 700,
              fontSize: "12px",
              color: theme.accent,
              letterSpacing: "0.5px",
              lineHeight: 1.1,
            }}
          >
            {student.Class_Name || "-"}
          </div>
        </div>

        {/* Tahun Ajaran */}
        <div style={{ marginTop: "5px" }}>
          <div style={{ fontSize: "5px", letterSpacing: "1.4px", textTransform: "uppercase", color: "#9fb6da", fontWeight: 600 }}>
            TAHUN PELAJARAN
          </div>
          <div style={{ fontWeight: 700, fontSize: "9px", color: "#fff", letterSpacing: "0.5px" }}>
            {student.Academic_Year || "2026/2027"}
          </div>
        </div>

        {/* QR Code */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "6px",
              padding: "3px",
              boxShadow: "0 3px 10px rgba(0,0,0,.35)",
            }}
          >
            <img src={qrUrl} alt="QR" style={{ width: "46px", height: "46px", display: "block" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "3px", color: "#cfe0ff", textAlign: "left" }}>
            <span style={{ color: theme.accent, fontSize: "9px" }}>←</span>
            <span style={{ fontSize: "5px", fontWeight: 700, letterSpacing: "0.6px", lineHeight: 1.25, textTransform: "uppercase" }}>
              SCAN<br />UNTUK<br />ABSENSI
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 3,
          height: "16px",
          background: "rgba(4,14,33,.78)",
          borderTop: `1px solid ${theme.accent}80`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 7px",
          boxSizing: "border-box",
          backdropFilter: "blur(2px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "3px",
            color: "#cfe0ff",
            fontSize: "4.6px",
            fontWeight: 700,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          <span style={{ color: theme.accent, fontSize: "6px" }}></span>
          <span>KARTU ABSENSI SISWA</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", lineHeight: 1 }}>
          <span style={{ fontSize: "3.6px", letterSpacing: "0.8px", color: "#8fa6cc", textTransform: "uppercase" }}>
            NO. KARTU
          </span>
          <span
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: "5.4px",
              fontWeight: 700,
              color: theme.accent,
              letterSpacing: "0.5px",
            }}
          >
            {student.Student_ID || "-"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Tema Warna
// ============================================
function getTheme(id: string) {
  const themes: Record<string, any> = {
    navy: {
      front: "radial-gradient(120% 80% at 50% -10%, #16407e 0%, #0c2c5e 42%, #081d40 100%)",
      accent: "#f5c542",
      accent2: "#caa12f",
      pill1: "#2f6fd0",
      pill2: "#3f86e6",
    },
    emerald: {
      front: "radial-gradient(120% 80% at 50% -10%, #0f5132 0%, #0b3d27 42%, #07271a 100%)",
      accent: "#fbbf24",
      accent2: "#d39e1a",
      pill1: "#059669",
      pill2: "#10b981",
    },
    maroon: {
      front: "radial-gradient(120% 80% at 50% -10%, #6b1f2a 0%, #4d141d 42%, #320c13 100%)",
      accent: "#f4c06a",
      accent2: "#cf9f4d",
      pill1: "#9f1239",
      pill2: "#be123c",
    },
    slate: {
      front: "radial-gradient(120% 80% at 50% -10%, #334155 0%, #1f2937 42%, #0f172a 100%)",
      accent: "#e2e8f0",
      accent2: "#b6c2d1",
      pill1: "#475569",
      pill2: "#64748b",
    },
    teal: {
      front: "radial-gradient(120% 80% at 50% -10%, #0e4f57 0%, #0a3a40 42%, #06262a 100%)",
      accent: "#5eead4",
      accent2: "#2dd4bf",
      pill1: "#0d9488",
      pill2: "#14b8a6",
    },
    cocoa: {
      front: "radial-gradient(120% 80% at 50% -10%, #4a2c1a 0%, #341e12 42%, #21130b 100%)",
      accent: "#e8b06a",
      accent2: "#c8924f",
      pill1: "#92400e",
      pill2: "#b45309",
    },
    whiteRed: {
      front: "linear-gradient(180deg, #991b1b 0%, #dc2626 18%, #ffffff 27%, #ffffff 72%, #dc2626 82%, #991b1b 100%)",
      accent: "#b91c1c",
      accent2: "#991b1b",
      pill1: "#dc2626",
      pill2: "#ef4444",
    },
    whiteBlue: {
      front: "linear-gradient(180deg, #1e3a8a 0%, #2563eb 18%, #ffffff 27%, #ffffff 72%, #2563eb 82%, #1e3a8a 100%)",
      accent: "#1d4ed8",
      accent2: "#1e3a8a",
      pill1: "#2563eb",
      pill2: "#3b82f6",
    },
    whiteGrey: {
      front: "linear-gradient(180deg, #334155 0%, #64748b 18%, #ffffff 27%, #ffffff 72%, #64748b 82%, #334155 100%)",
      accent: "#475569",
      accent2: "#334155",
      pill1: "#64748b",
      pill2: "#94a3b8",
    },
  };
  return themes[id] || themes.navy;
}