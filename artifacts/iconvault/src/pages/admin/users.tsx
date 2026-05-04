import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { UserTier } from "@/contexts/AuthContext";

interface UserRow {
  id: string;
  email: string;
  role: string;
  tier: UserTier;
  created_at: string;
}

const ROLE_COLORS: Record<string, string> = { admin: "#FF6B35", staff: "#4DBBFF", user: "#FFE034" };

function AdminUsers() {
  const { role } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (role === "admin") {
      supabase
        .from("profiles")
        .select("id, email, role, tier, created_at")
        .order("created_at", { ascending: false })
        .limit(100)
        .then(({ data }) => {
          if (data) setUsers(data as UserRow[]);
          setLoading(false);
        });
    } else {
      setLoading(false);
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

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const plusCount = users.filter(u => u.tier === "plus").length;
  const adminCount = users.filter(u => u.role === "admin").length;

  return (
    <AdminLayout title="KELOLA PENGGUNA">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b-[4px] border-foreground pb-4">
          <Users className="w-7 h-7" />
          <div>
            <h1 className="font-black text-2xl">KELOLA PENGGUNA</h1>
            <p className="font-mono text-xs opacity-50">{users.length} pengguna terdaftar</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "TOTAL USER", value: users.length, bg: "#FFE034" },
            { label: "PLUS ✦", value: plusCount, bg: "#FF6B9D" },
            { label: "ADMIN", value: adminCount, bg: "#FF6B35" },
          ].map(s => (
            <div key={s.label} className="nb-card p-4" style={{ background: s.bg }}>
              <p className="font-mono text-xs font-bold opacity-70 mb-1">{s.label}</p>
              <p className="font-black text-2xl">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="nb-card p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 border-b-[3px] border-foreground pb-4">
            <h2 className="font-black text-lg flex items-center gap-2">
              <Users className="w-5 h-5" /> DAFTAR PENGGUNA
            </h2>
            <input
              type="text"
              placeholder="Cari email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border-[3px] border-foreground px-3 py-1.5 font-mono text-sm focus:outline-none w-full sm:w-48"
            />
          </div>

          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-muted animate-pulse border-[2px] border-foreground" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="font-mono text-sm opacity-50 py-4 text-center">
              {search ? "Tidak ada hasil pencarian." : "Belum ada data pengguna."}
            </p>
          ) : (
            <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="border-b-[3px] border-foreground">
                    <th className="text-left py-2 pr-4 font-black">EMAIL</th>
                    <th className="text-left py-2 pr-3 font-black whitespace-nowrap">BERGABUNG</th>
                    <th className="text-left py-2 pr-3 font-black">PERAN</th>
                    <th className="text-left py-2 font-black">TIER</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} className="border-b-[2px] border-foreground/10 hover:bg-secondary/50">
                      <td className="py-3 pr-4 truncate max-w-[180px]" title={u.email}>{u.email}</td>
                      <td className="py-3 pr-3 opacity-50 whitespace-nowrap text-xs">
                        {new Date(u.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td className="py-3 pr-3">
                        <select
                          value={u.role}
                          onChange={e => changeRole(u.id, e.target.value)}
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
                          onChange={e => changeTier(u.id, e.target.value as UserTier)}
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
      </div>
    </AdminLayout>
  );
}

export default function AdminUsersPage() {
  return (
    <RoleGuard requiredRole="admin">
      <AdminUsers />
    </RoleGuard>
  );
}
