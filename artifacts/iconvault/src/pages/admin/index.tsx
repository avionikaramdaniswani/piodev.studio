import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Shield, Users, Upload, BarChart2, Download, Heart, Grid, LogOut, ChevronRight, Sparkles } from "lucide-react";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { TierBadge } from "@/components/shared/TierBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useGetIconStats } from "@workspace/api-client-react";
import { supabase } from "@/lib/supabase";
import type { UserTier } from "@/contexts/AuthContext";

interface UserRow {
  id: string;
  email: string;
  role: string;
  tier: UserTier;
  created_at: string;
}

function AdminDashboard() {
  const { user, role, signOut } = useAuth();
  const { data: stats } = useGetIconStats();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (role === "admin") {
      supabase
        .from("profiles")
        .select("id, email, role, tier, created_at")
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data }) => {
          if (data) setUsers(data as UserRow[]);
          setLoadingUsers(false);
        });
    } else {
      setLoadingUsers(false);
    }
  }, [role]);

  const changeRole = async (userId: string, newRole: string) => {
    await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const changeTier = async (userId: string, newTier: UserTier) => {
    await supabase.from("profiles").update({ tier: newTier }).eq("id", userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, tier: newTier } : u));
  };

  const ROLE_COLORS: Record<string, string> = { admin: "#FF6B35", staff: "#4DBBFF", user: "#FFE034" };
  const plusCount = users.filter(u => u.tier === "plus").length;
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div className="max-w-6xl mx-auto py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="nb-card overflow-hidden">
        <div className="h-2 w-full" style={{ background: "#FF6B35" }} />
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border-[3px] border-foreground shadow-[3px_3px_0_#0A0A0A] flex items-center justify-center font-black text-sm shrink-0" style={{ background: "#FF6B35", color: "white" }}>
              {initials}
            </div>
            <div>
              <h1 className="font-black text-2xl flex items-center gap-2">
                <Shield className="w-6 h-6" /> PANEL ADMIN
              </h1>
              <p className="font-mono text-xs opacity-50">{user?.email} — <span className="uppercase font-black">{role}</span></p>
            </div>
          </div>
          <button onClick={signOut} className="nb-btn px-4 py-2 text-sm font-black flex items-center gap-2" style={{ background: "#FF6B35", color: "white" }}>
            <LogOut className="w-4 h-4" /> KELUAR
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "TOTAL IKON", value: stats?.totalIcons ?? "–", icon: <Grid className="w-6 h-6" />, bg: "#FFE034" },
          { label: "TOTAL UNDUHAN", value: stats?.totalDownloads ?? "–", icon: <Download className="w-6 h-6" />, bg: "#FF6B9D" },
          { label: "TOTAL SUKA", value: stats?.totalLikes ?? "–", icon: <Heart className="w-6 h-6" />, bg: "#4DBBFF" },
          { label: "PENGGUNA PLUS", value: role === "admin" ? plusCount : "–", icon: <Sparkles className="w-6 h-6" />, bg: "#00E676" },
        ].map(s => (
          <div key={s.label} className="nb-card p-5" style={{ background: s.bg }}>
            <div className="flex items-center justify-between mb-3 opacity-70">{s.icon}<BarChart2 className="w-4 h-4" /></div>
            <p className="font-mono text-xs font-bold opacity-70 mb-1">{s.label}</p>
            <p className="font-black text-3xl">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="nb-card p-6">
        <h2 className="font-black text-lg mb-4 border-b-[3px] border-foreground pb-3">AKSI CEPAT</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/upload">
            <div className="border-[3px] border-foreground p-4 flex items-center justify-between hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0A0A0A] transition-all cursor-pointer" style={{ background: "#FFE034" }}>
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5" />
                <div>
                  <p className="font-black text-sm">UPLOAD IKON BARU</p>
                  <p className="font-mono text-xs opacity-60">Tambah ikon ke koleksi</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" />
            </div>
          </Link>
          <Link href="/icons">
            <div className="border-[3px] border-foreground p-4 flex items-center justify-between hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0A0A0A] transition-all cursor-pointer" style={{ background: "#4DBBFF" }}>
              <div className="flex items-center gap-3">
                <Grid className="w-5 h-5" />
                <div>
                  <p className="font-black text-sm">LIHAT SEMUA IKON</p>
                  <p className="font-mono text-xs opacity-60">Kelola koleksi ikon</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" />
            </div>
          </Link>
        </div>
      </div>

      {/* User Management — admin only */}
      {role === "admin" && (
        <div className="nb-card p-6">
          <h2 className="font-black text-lg mb-4 border-b-[3px] border-foreground pb-3 flex items-center gap-2">
            <Users className="w-5 h-5" /> KELOLA PENGGUNA
            <span className="font-mono text-xs font-normal opacity-50 ml-auto">{users.length} pengguna terakhir</span>
          </h2>

          {loadingUsers ? (
            <div className="flex flex-col gap-2">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-muted animate-pulse border-[2px] border-foreground" />)}
            </div>
          ) : users.length === 0 ? (
            <p className="font-mono text-sm opacity-50">Belum ada data. Pastikan SQL RBAC sudah dijalankan di Supabase.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="border-b-[3px] border-foreground">
                    <th className="text-left py-2 pr-4 font-black">EMAIL</th>
                    <th className="text-left py-2 pr-3 font-black">BERGABUNG</th>
                    <th className="text-left py-2 pr-3 font-black">PERAN</th>
                    <th className="text-left py-2 font-black">TIER</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b-[2px] border-foreground/10 hover:bg-secondary/50">
                      <td className="py-3 pr-4 truncate max-w-[160px]" title={u.email}>{u.email}</td>
                      <td className="py-3 pr-3 opacity-50 whitespace-nowrap text-xs">
                        {new Date(u.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td className="py-3 pr-3">
                        <select
                          value={u.role}
                          onChange={(e) => changeRole(u.id, e.target.value)}
                          className="border-[2px] border-foreground font-black text-xs px-2 py-1 cursor-pointer"
                          style={{ background: ROLE_COLORS[u.role] ?? "#FFE034" }}
                        >
                          <option value="user">USER</option>
                          <option value="staff">STAFF</option>
                          <option value="admin">ADMIN</option>
                        </select>
                      </td>
                      <td className="py-3">
                        <select
                          value={u.tier ?? "free"}
                          onChange={(e) => changeTier(u.id, e.target.value as UserTier)}
                          className="border-[2px] border-foreground font-black text-xs px-2 py-1 cursor-pointer"
                          style={{ background: u.tier === "plus" ? "#FFE034" : "#e5e5e5" }}
                        >
                          <option value="free">FREE</option>
                          <option value="plus">PLUS ✦</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
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
