import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LogOut, Mail, Shield, Calendar, Key,
  Sparkles, Check, User, Lock, Download,
  Pencil, X, CheckCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { TierBadge } from "@/components/shared/TierBadge";

const ROLE_META: Record<string, { label: string; bg: string; color: string }> = {
  admin: { label: "Admin", bg: "#FF6B35", color: "white" },
  staff: { label: "Staff", bg: "#4DBBFF", color: "white" },
  user: { label: "Pengguna", bg: "#FFE034", color: "#0A0A0A" },
};

const PLUS_PERKS = [
  "Unduh ikon tanpa batas",
  "Akses koleksi eksklusif Plus",
  "Export dalam format premium (PDF, WebP)",
  "Prioritas fitur baru",
  "Dukungan langsung via email",
];

type TabId = "akun" | "langganan" | "keamanan";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "akun", label: "AKUN", icon: <User className="w-4 h-4" /> },
  { id: "langganan", label: "LANGGANAN", icon: <Sparkles className="w-4 h-4" /> },
  { id: "keamanan", label: "KEAMANAN", icon: <Lock className="w-4 h-4" /> },
];

function UsernameEditor() {
  const { username, updateUsername, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(username ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = () => {
    setValue(username ?? "");
    setError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    const { error: err } = await updateUsername(value);
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    await refreshProfile();
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setError(null);
    setValue(username ?? "");
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            autoFocus
            className="nb-input flex-1 px-3 py-2 text-sm font-bold"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="nama_pengguna_kamu"
            maxLength={32}
            disabled={saving}
            onKeyDown={e => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="nb-btn px-3 py-2 text-xs font-black flex items-center gap-1 disabled:opacity-50"
            style={{ background: "#00E676" }}
          >
            <CheckCheck className="w-3 h-3" /> {saving ? "..." : "SIMPAN"}
          </button>
          <button onClick={handleCancel} className="opacity-50 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        {error && <p className="font-mono text-xs" style={{ color: "#FF6B35" }}>{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <p className="font-bold">
        {username ? (
          <span className="font-mono">@{username}</span>
        ) : (
          <span className="opacity-40 italic text-sm">Belum diatur</span>
        )}
      </p>
      <button
        onClick={handleEdit}
        className="opacity-40 hover:opacity-100 transition-opacity"
        title="Edit nama pengguna"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function QuotaBar() {
  const { tier, downloadsToday, quotaLimit } = useAuth();
  const isPlus = tier === "plus";

  if (isPlus) {
    return (
      <div className="flex items-center gap-3 py-4 border-b-[2px] border-foreground/10">
        <div className="opacity-40 mt-0.5 shrink-0"><Download className="w-4 h-4" /></div>
        <div className="flex-1">
          <p className="font-mono text-[10px] opacity-40 mb-0.5">KUOTA UNDUHAN</p>
          <div className="flex items-center gap-2">
            <p className="font-bold">Tidak terbatas</p>
            <TierBadge tier="plus" size="sm" />
          </div>
        </div>
      </div>
    );
  }

  const pct = Math.min((downloadsToday / quotaLimit) * 100, 100);
  const remaining = quotaLimit - downloadsToday;
  const isLow = remaining <= 10;
  const barColor = isLow ? "#FF6B35" : "#00E676";

  return (
    <div className="flex flex-col gap-2 py-4 border-b-[2px] border-foreground/10">
      <div className="flex items-start gap-4">
        <div className="opacity-40 mt-0.5 shrink-0"><Download className="w-4 h-4" /></div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] opacity-40 mb-0.5">KUOTA UNDUHAN HARI INI</p>
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold">
              {downloadsToday} / {quotaLimit}
              <span className="font-mono text-xs opacity-50 ml-2">({remaining} tersisa)</span>
            </p>
          </div>
          <div className="h-2.5 w-full border-[2px] border-foreground bg-background">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${pct}%`, background: barColor }}
            />
          </div>
          {isLow && remaining > 0 && (
            <p className="font-mono text-[10px] mt-1.5" style={{ color: "#FF6B35" }}>
              Kuota hampir habis! Upgrade ke Plus untuk unduhan tak terbatas.
            </p>
          )}
          {remaining === 0 && (
            <p className="font-mono text-[10px] mt-1.5" style={{ color: "#FF6B35" }}>
              Kuota hari ini habis. Reset otomatis tengah malam.
            </p>
          )}
        </div>
      </div>
      {remaining === 0 && (
        <Link
          href="/plus"
          className="nb-btn py-2 text-xs font-black flex items-center justify-center gap-1.5 ml-8"
          style={{ background: "#FFE034" }}
        >
          <Sparkles className="w-3 h-3" /> UPGRADE KE PLUS
        </Link>
      )}
    </div>
  );
}

function TabAkun() {
  const { user, role, tier } = useAuth();
  const roleMeta = ROLE_META[role ?? "user"];
  const joinedAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "–";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-4 py-4 border-b-[2px] border-foreground/10">
        <div className="opacity-40 mt-0.5 shrink-0"><User className="w-4 h-4" /></div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] opacity-40 mb-0.5">NAMA PENGGUNA</p>
          <UsernameEditor />
        </div>
      </div>
      <div className="flex items-start gap-4 py-4 border-b-[2px] border-foreground/10">
        <div className="opacity-40 mt-0.5 shrink-0"><Mail className="w-4 h-4" /></div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] opacity-40 mb-0.5">EMAIL</p>
          <p className="font-bold break-all">{user?.email}</p>
        </div>
      </div>
      <div className="flex items-start gap-4 py-4 border-b-[2px] border-foreground/10">
        <div className="opacity-40 mt-0.5 shrink-0"><Shield className="w-4 h-4" /></div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] opacity-40 mb-1">PERAN & PAKET</p>
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
      <QuotaBar />
      <div className="flex items-start gap-4 py-4 border-b-[2px] border-foreground/10">
        <div className="opacity-40 mt-0.5 shrink-0"><Calendar className="w-4 h-4" /></div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] opacity-40 mb-0.5">BERGABUNG SEJAK</p>
          <p className="font-bold">{joinedAt}</p>
        </div>
      </div>
      <div className="flex items-start gap-4 py-4">
        <div className="opacity-40 mt-0.5 shrink-0"><Key className="w-4 h-4" /></div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] opacity-40 mb-0.5">USER ID</p>
          <p className="font-mono text-xs opacity-60 break-all">{user?.id}</p>
        </div>
      </div>
    </div>
  );
}

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

function TabKeamanan() {
  const { signOut } = useAuth();
  const [, navigate] = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex flex-col gap-5">
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

function ProfilContent() {
  const { user, role, tier, username } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("akun");

  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : (user?.email?.slice(0, 2).toUpperCase() ?? "??");

  const roleMeta = ROLE_META[role ?? "user"];
  const isPlus = tier === "plus";

  return (
    <div className="max-w-2xl mx-auto py-8 flex flex-col gap-6">
      <div className="nb-card overflow-hidden">
        <div className="h-3 w-full" style={{ background: isPlus ? "#FFE034" : "#4DBBFF" }} />
        <div className="p-6 flex items-center gap-5">
          <div className="w-16 h-16 border-[4px] border-foreground shadow-[4px_4px_0_#0A0A0A] flex items-center justify-center text-2xl font-black shrink-0" style={{ background: "#4DBBFF" }}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-black text-lg leading-tight">
              {username ? `@${username}` : <span className="opacity-40 font-mono text-sm italic">Belum ada nama pengguna</span>}
            </p>
            <p className="font-mono text-xs opacity-50 truncate mt-0.5 mb-2">{user?.email}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-xs px-2 py-1 border-[2px] border-foreground shadow-[2px_2px_0_#0A0A0A]" style={{ background: roleMeta.bg, color: roleMeta.color }}>
                {roleMeta.label.toUpperCase()}
              </span>
              <TierBadge tier={tier} size="sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-0">
        <div className="flex border-[3px] border-foreground overflow-hidden shadow-[4px_4px_0_#0A0A0A]">
          {TABS.map((tab, i) => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 py-3 font-black text-sm transition-all ${i > 0 ? "border-l-[3px] border-foreground" : ""} ${active ? "" : "opacity-50 hover:opacity-80"}`} style={{ background: active ? "#FFE034" : "transparent" }}>
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
        <div className="border-[3px] border-t-0 border-foreground p-6" style={{ background: "var(--card)" }}>
          {activeTab === "akun" && <TabAkun />}
          {activeTab === "langganan" && <TabLangganan />}
          {activeTab === "keamanan" && <TabKeamanan />}
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
