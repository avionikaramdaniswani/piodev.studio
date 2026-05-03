import { useState } from "react";
import { useLocation } from "wouter";
import {
  LogOut, Mail, Shield, Calendar, Key,
  Sparkles, Check, User, Lock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { TierBadge } from "@/components/shared/TierBadge";

const ROLE_META: Record<string, { label: string; bg: string; color: string }> = {
  admin: { label: "Admin", bg: "#FF6B35", color: "white" },
  staff: { label: "Staff", bg: "#4DBBFF", color: "white" },
  user:  { label: "Pengguna", bg: "#FFE034", color: "#0A0A0A" },
};

const PLUS_PERKS = [
  "Unduh ikon tanpa batas",
  "Akses koleksi eksklusif Plus",
  "Export dalam format premium (PDF, WebP)",
  "Prioritas fitur baru",
  "Dukungan langsung via email",
];

const FREE_PERKS = [
  "Akses 10.000+ ikon gratis",
  "Unduh SVG & PNG standar",
  "Semua developer tools",
];

type TabId = "akun" | "langganan" | "keamanan";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "akun",       label: "AKUN",        icon: <User className="w-4 h-4" /> },
  { id: "langganan",  label: "LANGGANAN",   icon: <Sparkles className="w-4 h-4" /> },
  { id: "keamanan",   label: "KEAMANAN",    icon: <Lock className="w-4 h-4" /> },
];

/* ── Tab: Akun ─────────────────────────────────────────── */
function TabAkun() {
  const { user, role } = useAuth();
  const roleMeta = ROLE_META[role ?? "user"];
  const joinedAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "–";

  const rows = [
    { icon: <Mail className="w-4 h-4" />,     label: "EMAIL",           value: user?.email },
    { icon: <Shield className="w-4 h-4" />,   label: "PERAN",           value: roleMeta.label.toUpperCase() },
    { icon: <Calendar className="w-4 h-4" />, label: "BERGABUNG SEJAK", value: joinedAt },
    { icon: <Key className="w-4 h-4" />,      label: "USER ID",         value: user?.id, mono: true },
  ];

  return (
    <div className="flex flex-col gap-1">
      {rows.map(r => (
        <div key={r.label} className="flex items-start gap-4 py-4 border-b-[2px] border-foreground/10 last:border-0">
          <div className="opacity-40 mt-0.5 shrink-0">{r.icon}</div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] opacity-40 mb-0.5">{r.label}</p>
            <p className={`font-bold break-all ${r.mono ? "font-mono text-xs opacity-60" : ""}`}>{r.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Tab: Langganan ────────────────────────────────────── */
function TabLangganan() {
  const { tier } = useAuth();
  const isPlus = tier === "plus";

  if (isPlus) {
    return (
      <div className="flex flex-col gap-4">
        <div className="border-[3px] border-foreground p-5 shadow-[4px_4px_0_#0A0A0A]" style={{ background: "#FFE034" }}>
          <p className="font-black text-xl flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5" /> KAMU PENGGUNA PLUS!
          </p>
          <p className="font-mono text-xs opacity-70">Nikmati semua fitur premium PioDev.studio</p>
        </div>
        <ul className="flex flex-col gap-2">
          {PLUS_PERKS.map(p => (
            <li key={p} className="flex items-center gap-3 font-mono text-sm py-2 border-b-[2px] border-foreground/10 last:border-0">
              <span className="w-5 h-5 border-[2px] border-foreground flex items-center justify-center shrink-0" style={{ background: "#00E676" }}>
                <Check className="w-3 h-3" />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-black text-lg">Paket aktif: <TierBadge tier="free" size="sm" /></p>
          <p className="font-mono text-xs opacity-50 mt-1">Upgrade untuk akses penuh ke semua fitur</p>
        </div>
      </div>
      <div className="border-[3px] border-foreground p-5 flex flex-col gap-4" style={{ background: "#FFE034" }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-black text-2xl">Plus — Rp 49.000<span className="font-mono text-sm font-normal">/bln</span></p>
            <p className="font-mono text-xs opacity-70 mt-0.5">Atau Rp 470.000/tahun · hemat 20%</p>
          </div>
          <TierBadge tier="plus" size="sm" />
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {PLUS_PERKS.map(p => (
            <li key={p} className="flex items-center gap-2 font-mono text-xs">
              <Sparkles className="w-3 h-3 shrink-0" /> {p}
            </li>
          ))}
        </ul>
        <Link
          href="/plus"
          className="nb-btn py-3 font-black flex items-center justify-center gap-2"
          style={{ background: "#0A0A0A", color: "white" }}
        >
          <Sparkles className="w-4 h-4" /> LIHAT DETAIL & UPGRADE →
        </Link>
      </div>
    </div>
  );
}

/* ── Tab: Keamanan ─────────────────────────────────────── */
function TabKeamanan() {
  const { signOut } = useAuth();
  const [, navigate] = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Password section — placeholder for future */}
      <div className="border-[3px] border-foreground p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b-[2px] border-foreground/10 pb-3">
          <Lock className="w-4 h-4 opacity-40" />
          <p className="font-black">KATA SANDI</p>
        </div>
        <p className="font-mono text-xs opacity-50">
          Kelola kata sandi akun kamu. Perubahan kata sandi dikirim via email yang terdaftar.
        </p>
        <button
          className="nb-btn py-2 px-4 font-black text-sm self-start"
          style={{ background: "#4DBBFF" }}
          onClick={() => alert("Fitur ganti password segera hadir!")}
        >
          GANTI KATA SANDI
        </button>
      </div>

      {/* Danger zone */}
      <div className="border-[3px] border-foreground p-5 flex flex-col gap-3" style={{ borderColor: "#FF6B35" }}>
        <div className="flex items-center gap-2 border-b-[2px] border-foreground/10 pb-3">
          <LogOut className="w-4 h-4 opacity-40" />
          <p className="font-black">SESI AKTIF</p>
        </div>
        <p className="font-mono text-xs opacity-50">
          Keluar dari akun di perangkat ini. Kamu perlu masuk kembali untuk mengakses fitur member.
        </p>
        <button
          onClick={handleSignOut}
          className="nb-btn py-2 px-4 font-black text-sm flex items-center gap-2 self-start"
          style={{ background: "#FF6B35", color: "white" }}
        >
          <LogOut className="w-4 h-4" /> KELUAR DARI AKUN
        </button>
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────── */
function ProfilContent() {
  const { user, role, tier } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("akun");

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??";
  const roleMeta = ROLE_META[role ?? "user"];
  const isPlus = tier === "plus";

  return (
    <div className="max-w-2xl mx-auto py-8 flex flex-col gap-6">
      {/* Profile header */}
      <div className="nb-card overflow-hidden">
        <div className="h-3 w-full" style={{ background: isPlus ? "#FFE034" : "#4DBBFF" }} />
        <div className="p-6 flex items-center gap-5">
          <div
            className="w-16 h-16 border-[4px] border-foreground shadow-[4px_4px_0_#0A0A0A] flex items-center justify-center text-2xl font-black shrink-0"
            style={{ background: "#4DBBFF" }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm opacity-50 truncate mb-2">{user?.email}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="font-black text-xs px-2 py-1 border-[2px] border-foreground shadow-[2px_2px_0_#0A0A0A]"
                style={{ background: roleMeta.bg, color: roleMeta.color }}
              >
                {roleMeta.label.toUpperCase()}
              </span>
              <TierBadge tier={tier} size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col gap-0">
        {/* Tab bar */}
        <div className="flex border-[3px] border-foreground overflow-hidden shadow-[4px_4px_0_#0A0A0A]">
          {TABS.map((tab, i) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 font-black text-sm transition-all
                  ${i > 0 ? "border-l-[3px] border-foreground" : ""}
                  ${active ? "" : "opacity-50 hover:opacity-80"}`}
                style={{ background: active ? "#FFE034" : "transparent" }}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="border-[3px] border-t-0 border-foreground p-6" style={{ background: "var(--card)" }}>
          {activeTab === "akun"      && <TabAkun />}
          {activeTab === "langganan" && <TabLangganan />}
          {activeTab === "keamanan"  && <TabKeamanan />}
        </div>
      </div>
    </div>
  );
}

export default function ProfilPage() {
  return (
    <RoleGuard requiredRole="user">
      <ProfilContent />
    </RoleGuard>
  );
}
