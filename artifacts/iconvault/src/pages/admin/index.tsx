import { BarChart2, Download, Heart, Grid, Upload, Users, Sparkles, ChevronRight, Shield } from "lucide-react";
import { Link } from "wouter";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useGetIconStats } from "@workspace/api-client-react";

function AdminDashboard() {
  const { role } = useAuth();
  const { data: stats } = useGetIconStats();

  const STATS = [
    { label: "TOTAL IKON", value: stats?.totalIcons ?? "–", icon: <Grid className="w-6 h-6" />, bg: "#FFE034" },
    { label: "TOTAL UNDUHAN", value: stats?.totalDownloads ?? "–", icon: <Download className="w-6 h-6" />, bg: "#FF6B9D" },
    { label: "TOTAL SUKA", value: stats?.totalLikes ?? "–", icon: <Heart className="w-6 h-6" />, bg: "#4DBBFF" },
    { label: "PENGGUNA PLUS", value: "–", icon: <Sparkles className="w-6 h-6" />, bg: "#00E676" },
  ];

  const QUICK_ACTIONS = [
    { href: "/admin/upload", label: "UPLOAD IKON BARU", desc: "Tambah ikon ke koleksi", icon: Upload, bg: "#00E676" },
    { href: "/admin/icons", label: "KELOLA SEMUA IKON", desc: "Edit, hapus, kelola ikon", icon: Grid, bg: "#4DBBFF" },
    ...(role === "admin" ? [{ href: "/admin/users", label: "KELOLA PENGGUNA", desc: "Atur role & tier user", icon: Users, bg: "#FF6B9D" }] : []),
  ];

  return (
    <AdminLayout title="DASHBOARD">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b-[4px] border-foreground pb-4">
          <Shield className="w-7 h-7" />
          <div>
            <h1 className="font-black text-2xl">DASHBOARD</h1>
            <p className="font-mono text-xs opacity-50">Selamat datang di Panel Admin IconVault</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(s => (
            <div key={s.label} className="nb-card p-5" style={{ background: s.bg }}>
              <div className="flex items-center justify-between mb-3 opacity-70">
                {s.icon}
                <BarChart2 className="w-4 h-4" />
              </div>
              <p className="font-mono text-xs font-bold opacity-70 mb-1">{s.label}</p>
              <p className="font-black text-3xl">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="nb-card p-6">
          <h2 className="font-black text-lg mb-4 border-b-[3px] border-foreground pb-3">AKSI CEPAT</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {QUICK_ACTIONS.map(a => (
              <Link key={a.href} href={a.href}>
                <div
                  className="border-[3px] border-foreground p-4 flex items-center justify-between hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0A0A0A] transition-all cursor-pointer"
                  style={{ background: a.bg }}
                >
                  <div className="flex items-center gap-3">
                    <a.icon className="w-5 h-5" />
                    <div>
                      <p className="font-black text-sm">{a.label}</p>
                      <p className="font-mono text-xs opacity-60">{a.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminPage() {
  return (
    <RoleGuard requiredRole="staff">
      <AdminDashboard />
    </RoleGuard>
  );
}
