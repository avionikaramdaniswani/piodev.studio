import { useLocation } from "wouter";
import { LogOut, Mail, Shield, Calendar, Key } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { RoleGuard } from "@/components/shared/RoleGuard";

const ROLE_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  admin: { label: "Admin", bg: "#FF6B35", color: "white" },
  staff: { label: "Staff", bg: "#4DBBFF", color: "white" },
  user:  { label: "Pengguna", bg: "#FFE034", color: "#0A0A0A" },
};

function ProfilContent() {
  const { user, role, signOut } = useAuth();
  const [, navigate] = useLocation();

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??";
  const roleInfo = ROLE_LABEL[role ?? "user"];
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
        <div className="h-4 w-full" style={{ background: "#4DBBFF" }} />
        <div className="p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div
            className="w-20 h-20 border-[4px] border-foreground shadow-[4px_4px_0_#0A0A0A] flex items-center justify-center text-3xl font-black shrink-0"
            style={{ background: "#4DBBFF" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-sm opacity-50 mb-1 truncate">{user?.email}</p>
            <span
              className="inline-block font-black text-sm px-3 py-1 border-[3px] border-foreground shadow-[2px_2px_0_#0A0A0A]"
              style={{ background: roleInfo.bg, color: roleInfo.color }}
            >
              {roleInfo.label.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="nb-card p-6 flex flex-col gap-4">
        <h2 className="font-black text-xl border-b-[3px] border-foreground pb-3">INFORMASI AKUN</h2>

        <div className="flex items-start gap-4 py-3 border-b-[2px] border-foreground/10">
          <Mail className="w-5 h-5 mt-0.5 shrink-0 opacity-50" />
          <div>
            <p className="font-mono text-xs opacity-50 mb-0.5">EMAIL</p>
            <p className="font-bold">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-start gap-4 py-3 border-b-[2px] border-foreground/10">
          <Shield className="w-5 h-5 mt-0.5 shrink-0 opacity-50" />
          <div>
            <p className="font-mono text-xs opacity-50 mb-0.5">PERAN</p>
            <p className="font-bold uppercase">{roleInfo.label}</p>
          </div>
        </div>

        <div className="flex items-start gap-4 py-3 border-b-[2px] border-foreground/10">
          <Calendar className="w-5 h-5 mt-0.5 shrink-0 opacity-50" />
          <div>
            <p className="font-mono text-xs opacity-50 mb-0.5">BERGABUNG SEJAK</p>
            <p className="font-bold">{joinedAt}</p>
          </div>
        </div>

        <div className="flex items-start gap-4 py-3">
          <Key className="w-5 h-5 mt-0.5 shrink-0 opacity-50" />
          <div>
            <p className="font-mono text-xs opacity-50 mb-0.5">ID PENGGUNA</p>
            <p className="font-mono text-xs opacity-70 break-all">{user?.id}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="nb-card p-6 flex flex-col gap-4">
        <h2 className="font-black text-xl border-b-[3px] border-foreground pb-3">AKSI</h2>
        <button
          onClick={handleSignOut}
          className="nb-btn py-3 font-black flex items-center justify-center gap-2 w-full sm:w-auto"
          style={{ background: "#FF6B35", color: "white" }}
        >
          <LogOut className="w-5 h-5" /> KELUAR DARI AKUN
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
