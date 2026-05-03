import { useLocation } from "wouter";
import { LogOut, Mail, Shield, Calendar, Key, Sparkles, Check } from "lucide-react";
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

function ProfilContent() {
  const { user, role, tier, signOut } = useAuth();
  const [, navigate] = useLocation();

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??";
  const roleMeta = ROLE_META[role ?? "user"];
  const isPlus = tier === "plus";

  const joinedAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "-";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="max-w-2xl mx-auto py-8 flex flex-col gap-6">
      {/* Header card */}
      <div className="nb-card overflow-hidden">
        <div className="h-3 w-full" style={{ background: isPlus ? "#FFE034" : "#4DBBFF" }} />
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div
            className="w-20 h-20 border-[4px] border-foreground shadow-[4px_4px_0_#0A0A0A] flex items-center justify-center text-3xl font-black shrink-0"
            style={{ background: "#4DBBFF" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-sm opacity-50 mb-2 truncate">{user?.email}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="font-black text-sm px-3 py-1 border-[3px] border-foreground shadow-[2px_2px_0_#0A0A0A]"
                style={{ background: roleMeta.bg, color: roleMeta.color }}
              >
                {roleMeta.label.toUpperCase()}
              </span>
              <TierBadge tier={tier} size="md" />
            </div>
          </div>
        </div>
      </div>

      {/* Tier card */}
      <div className="nb-card overflow-hidden">
        <div className="p-6">
          <h2 className="font-black text-xl border-b-[3px] border-foreground pb-3 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" /> PAKET LANGGANAN
          </h2>

          {isPlus ? (
            <div className="flex flex-col gap-3">
              <div className="border-[3px] border-foreground p-4 shadow-[4px_4px_0_#0A0A0A]" style={{ background: "#FFE034" }}>
                <p className="font-black text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> KAMU PENGGUNA PLUS!
                </p>
                <p className="font-mono text-xs mt-1 opacity-70">Nikmati semua fitur premium PioDev.studio</p>
              </div>
              <ul className="flex flex-col gap-2">
                {PLUS_PERKS.map(p => (
                  <li key={p} className="flex items-center gap-2 font-mono text-sm">
                    <Check className="w-4 h-4 text-green-600 shrink-0" /> {p}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Free */}
                <div className="border-[3px] border-foreground p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-black">FREE</p>
                    <TierBadge tier="free" size="xs" />
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {FREE_PERKS.map(p => (
                      <li key={p} className="flex items-start gap-2 font-mono text-xs opacity-70">
                        <Check className="w-3 h-3 mt-0.5 shrink-0" /> {p}
                      </li>
                    ))}
                  </ul>
                  <p className="font-black text-lg mt-3">Gratis</p>
                </div>
                {/* Plus */}
                <div className="border-[3px] border-foreground p-4 shadow-[4px_4px_0_#0A0A0A]" style={{ background: "#FFE034" }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-black">PLUS</p>
                    <TierBadge tier="plus" size="xs" />
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {PLUS_PERKS.map(p => (
                      <li key={p} className="flex items-start gap-2 font-mono text-xs">
                        <Sparkles className="w-3 h-3 mt-0.5 shrink-0" /> {p}
                      </li>
                    ))}
                  </ul>
                  <p className="font-black text-lg mt-3">Rp 49.000<span className="font-mono text-xs font-normal">/bln</span></p>
                </div>
              </div>
              <button
                className="nb-btn py-3 font-black flex items-center justify-center gap-2 w-full"
                style={{ background: "#FFE034" }}
              >
                <Sparkles className="w-5 h-5" /> UPGRADE KE PLUS
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info akun */}
      <div className="nb-card p-6 flex flex-col gap-3">
        <h2 className="font-black text-xl border-b-[3px] border-foreground pb-3">INFORMASI AKUN</h2>
        {[
          { icon: <Mail className="w-4 h-4 opacity-40" />, label: "EMAIL", value: user?.email },
          { icon: <Shield className="w-4 h-4 opacity-40" />, label: "PERAN", value: roleMeta.label.toUpperCase() },
          { icon: <Calendar className="w-4 h-4 opacity-40" />, label: "BERGABUNG SEJAK", value: joinedAt },
          { icon: <Key className="w-4 h-4 opacity-40" />, label: "USER ID", value: user?.id, mono: true, small: true },
        ].map(row => (
          <div key={row.label} className="flex items-start gap-3 py-2.5 border-b-[2px] border-foreground/10 last:border-0">
            <div className="mt-0.5 shrink-0">{row.icon}</div>
            <div className="min-w-0">
              <p className="font-mono text-[10px] opacity-40 mb-0.5">{row.label}</p>
              <p className={`font-bold ${row.small ? "font-mono text-xs opacity-60 break-all" : ""}`}>{row.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Aksi */}
      <div className="nb-card p-6">
        <button
          onClick={handleSignOut}
          className="nb-btn py-3 px-6 font-black flex items-center gap-2"
          style={{ background: "#FF6B35", color: "white" }}
        >
          <LogOut className="w-4 h-4" /> KELUAR DARI AKUN
        </button>
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
