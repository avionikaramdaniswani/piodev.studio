import { RoleGuard } from "@/components/shared/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Users, Upload, Settings } from "lucide-react";
import { Link } from "wouter";

function AdminDashboard() {
  const { user, role } = useAuth();

  const tiles = [
    {
      icon: <Upload className="w-8 h-8" />,
      label: "UPLOAD IKON",
      desc: "Tambah ikon baru ke PioDev.studio",
      href: "/upload",
      color: "#FFE034",
      roles: ["staff", "admin"],
    },
    {
      icon: <Users className="w-8 h-8" />,
      label: "KELOLA PENGGUNA",
      desc: "Lihat dan atur peran pengguna",
      href: "/admin/users",
      color: "#4DBBFF",
      roles: ["admin"],
    },
    {
      icon: <Settings className="w-8 h-8" />,
      label: "PENGATURAN",
      desc: "Konfigurasi situs",
      href: "/admin/settings",
      color: "#00E676",
      roles: ["admin"],
    },
  ].filter(t => t.roles.includes(role ?? "user"));

  return (
    <div className="max-w-4xl mx-auto py-8 flex flex-col gap-8">
      <div>
        <div className="relative inline-block mb-2">
          <div className="absolute inset-0 translate-x-1 translate-y-1" style={{ background: "#FF6B35" }} />
          <h1 className="relative font-black text-4xl bg-card px-3 py-1 border-[3px] border-foreground flex items-center gap-3">
            <Shield className="w-8 h-8" /> PANEL ADMIN
          </h1>
        </div>
        <p className="font-mono text-sm opacity-60">
          Masuk sebagai <strong>{user?.email}</strong> — peran:{" "}
          <span className="font-black uppercase">{role}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href}>
            <div
              className="nb-card p-6 cursor-pointer hover:-translate-y-1 transition-transform"
              style={{ background: tile.color }}
            >
              <div className="mb-4">{tile.icon}</div>
              <h3 className="font-black text-xl mb-1">{tile.label}</h3>
              <p className="font-mono text-sm opacity-70">{tile.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RoleGuard requiredRole="staff">
      <AdminDashboard />
    </RoleGuard>
  );
}
