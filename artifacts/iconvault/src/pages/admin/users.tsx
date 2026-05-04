import { useEffect, useState } from "react";
import {
  Users, Eye, X, Mail, Shield, Calendar,
  Key, Sparkles, Download, User, Clock, Trash2, CalendarClock, Check,
} from "lucide-react";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { UserTier } from "@/contexts/AuthContext";

interface UserRow {
  id: string;
  email: string;
  username: string | null;
  role: string;
  tier: UserTier;
  plus_expires_at: string | null;
  downloads_today: number;
  created_at: string;
}

const ROLE_COLORS: Record<string, string> = { admin: "#FF6B35", staff: "#4DBBFF", user: "#FFE034" };
const ROLE_LABELS: Record<string, string> = { admin: "Admin", staff: "Staff", user: "User" };

function fmtDate(iso: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("id-ID", opts ?? { day: "numeric", month: "short", year: "numeric" });
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b-[2px] border-foreground/10 last:border-0">
      <div className="opacity-40 mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] opacity-40 mb-0.5">{label}</p>
        <div className="font-bold text-sm break-all">{children}</div>
      </div>
    </div>
  );
}

function UserDrawer({
  user,
  onClose,
  onRoleChange,
  onTierChange,
  onSetExpiry,
  onDelete,
}: {
  user: UserRow;
  onClose: () => void;
  onRoleChange: (id: string, role: string) => void;
  onTierChange: (id: string, tier: UserTier) => void;
  onSetExpiry: (id: string, expiresAt: string | null) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const isPlus = user.tier === "plus";
  const plusExpired = user.plus_expires_at && new Date() > new Date(user.plus_expires_at);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expiryDate, setExpiryDate] = useState(
    user.plus_expires_at ? user.plus_expires_at.split("T")[0] : ""
  );
  const [savingExpiry, setSavingExpiry] = useState(false);
  const [expirySaved, setExpirySaved] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(user.id);
    setDeleting(false);
  };

  const applyPreset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setExpiryDate(d.toISOString().split("T")[0]);
    setExpirySaved(false);
  };

  const handleSaveExpiry = async () => {
    setSavingExpiry(true);
    await onSetExpiry(user.id, expiryDate ? new Date(expiryDate).toISOString() : null);
    setSavingExpiry(false);
    setExpirySaved(true);
    setTimeout(() => setExpirySaved(false), 2000);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />
      <div
        className="fixed top-0 right-0 h-full z-50 w-full max-w-sm border-l-[4px] border-foreground shadow-[-8px_0_0_#0A0A0A] flex flex-col overflow-hidden"
        style={{ background: "#FFFBF0" }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b-[3px] border-foreground shrink-0"
          style={{ background: "#4DBBFF" }}
        >
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            <p className="font-black text-base">DETAIL PENGGUNA</p>
          </div>
          <button
            onClick={onClose}
            className="opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-0">
          <div
            className="flex items-center gap-3 p-4 border-[3px] border-foreground mb-4 shadow-[4px_4px_0_#0A0A0A]"
            style={{ background: isPlus ? "#FFE034" : "var(--card)" }}
          >
            <div
              className="w-12 h-12 border-[3px] border-foreground flex items-center justify-center font-black text-lg shrink-0"
              style={{ background: "#4DBBFF" }}
            >
              {(user.username ?? user.email).slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black truncate">
                {user.username ? `@${user.username}` : <span className="opacity-40 italic text-sm font-mono">Belum ada username</span>}
              </p>
              <p className="font-mono text-xs opacity-60 truncate">{user.email}</p>
            </div>
          </div>

          <DetailRow icon={<User className="w-4 h-4" />} label="USERNAME">
            {user.username ? (
              <span className="font-mono">@{user.username}</span>
            ) : (
              <span className="opacity-40 italic font-mono text-xs">Belum diatur</span>
            )}
          </DetailRow>

          <DetailRow icon={<Mail className="w-4 h-4" />} label="EMAIL">
            <span className="font-mono text-xs">{user.email}</span>
          </DetailRow>

          <DetailRow icon={<Calendar className="w-4 h-4" />} label="BERGABUNG SEJAK">
            {fmtDate(user.created_at, { day: "numeric", month: "long", year: "numeric" })}
          </DetailRow>

          <DetailRow icon={<Download className="w-4 h-4" />} label="UNDUHAN HARI INI">
            <span>{user.downloads_today ?? 0} unduhan</span>
          </DetailRow>

          <DetailRow icon={<Sparkles className="w-4 h-4" />} label="STATUS PLUS">
            {isPlus ? (
              <div className="flex flex-col gap-1">
                <span
                  className="font-black text-xs px-2 py-1 border-[2px] border-foreground self-start"
                  style={{ background: "#FFE034" }}
                >
                  PLUS AKTIF ✦
                </span>
                {user.plus_expires_at && (
                  <span className={`font-mono text-xs ${plusExpired ? "text-red-500" : "opacity-60"}`}>
                    {plusExpired ? "Kedaluwarsa: " : "Aktif hingga: "}
                    {fmtDate(user.plus_expires_at, { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
              </div>
            ) : (
              <span className="opacity-50 font-mono text-xs">Free tier</span>
            )}
          </DetailRow>

          <DetailRow icon={<Key className="w-4 h-4" />} label="USER ID">
            <span className="font-mono text-[10px] opacity-60 break-all">{user.id}</span>
          </DetailRow>

          <div className="mt-4 flex flex-col gap-3 border-t-[3px] border-foreground pt-4">
            <p className="font-black text-xs opacity-50">AKSI CEPAT</p>

            <div className="flex flex-col gap-1.5">
              <label className="font-black text-xs flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 opacity-50" /> PERAN
              </label>
              <select
                value={user.role}
                onChange={e => onRoleChange(user.id, e.target.value)}
                className="nb-input px-3 py-2 text-sm font-black cursor-pointer"
                style={{ background: ROLE_COLORS[user.role] ?? "#FFE034" }}
              >
                <option value="user">USER</option>
                <option value="staff">STAFF</option>
                <option value="admin">ADMIN</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-black text-xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 opacity-50" /> TIER
              </label>
              <select
                value={user.tier ?? "free"}
                onChange={e => onTierChange(user.id, e.target.value as UserTier)}
                className="nb-input px-3 py-2 text-sm font-black cursor-pointer"
                style={{ background: user.tier === "plus" ? "#FFE034" : "#e5e5e5" }}
              >
                <option value="free">FREE</option>
                <option value="plus">PLUS ✦</option>
              </select>
            </div>

            {isPlus && (
              <div className="flex flex-col gap-2 border-[2px] border-foreground p-3" style={{ background: "#FFFBF0" }}>
                <label className="font-black text-xs flex items-center gap-1">
                  <CalendarClock className="w-3.5 h-3.5 opacity-50" /> EXPIRY PLUS
                </label>

                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { label: "+30 hr", days: 30 },
                    { label: "+90 hr", days: 90 },
                    { label: "+1 thn", days: 365 },
                  ].map(p => (
                    <button
                      key={p.days}
                      onClick={() => applyPreset(p.days)}
                      className="nb-btn px-2 py-1 text-[10px] font-black"
                      style={{ background: "#4DBBFF" }}
                    >
                      {p.label}
                    </button>
                  ))}
                  <button
                    onClick={() => { setExpiryDate(""); setExpirySaved(false); }}
                    className="nb-btn px-2 py-1 text-[10px] font-black"
                    style={{ background: "#e5e5e5" }}
                  >
                    ∞ Tanpa batas
                  </button>
                </div>

                <input
                  type="date"
                  value={expiryDate}
                  onChange={e => { setExpiryDate(e.target.value); setExpirySaved(false); }}
                  className="nb-input px-2 py-1.5 text-xs font-mono w-full"
                  min={new Date().toISOString().split("T")[0]}
                />

                <button
                  onClick={handleSaveExpiry}
                  disabled={savingExpiry}
                  className="nb-btn py-1.5 font-black text-xs flex items-center justify-center gap-1 disabled:opacity-50 w-full"
                  style={{ background: expirySaved ? "#00E676" : "#FFE034" }}
                >
                  {expirySaved ? <><Check className="w-3 h-3" /> TERSIMPAN</> : savingExpiry ? "MENYIMPAN..." : "SIMPAN EXPIRY"}
                </button>

                {!expiryDate && (
                  <p className="font-mono text-[10px] opacity-50">Tanpa batas = Plus aktif selamanya.</p>
                )}
              </div>
            )}

            <div
              className="border-[2px] border-foreground p-3 font-mono text-[10px] opacity-50 flex items-start gap-2"
            >
              <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Perubahan peran dan tier langsung tersimpan ke database saat dipilih.</span>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t-[3px] border-foreground pt-4" style={{ borderColor: "#FF6B35" }}>
            <p className="font-black text-xs flex items-center gap-1.5" style={{ color: "#FF6B35" }}>
              <Trash2 className="w-3.5 h-3.5" /> ZONA BAHAYA
            </p>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="nb-btn py-2.5 px-4 font-black text-sm flex items-center justify-center gap-2 w-full"
                style={{ background: "white", borderColor: "#FF6B35", color: "#FF6B35" }}
              >
                <Trash2 className="w-4 h-4" /> HAPUS PENGGUNA
              </button>
            ) : (
              <div className="flex flex-col gap-2 border-[3px] border-foreground p-3" style={{ borderColor: "#FF6B35", background: "#FFF3EF" }}>
                <p className="font-black text-xs" style={{ color: "#FF6B35" }}>
                  Yakin hapus <span className="font-mono">{user.email}</span>?
                </p>
                <p className="font-mono text-[10px] opacity-60">Profil pengguna akan dihapus permanen dari database.</p>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                    className="flex-1 nb-btn py-2 font-black text-xs"
                    style={{ background: "white" }}
                  >
                    BATAL
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 nb-btn py-2 font-black text-xs flex items-center justify-center gap-1 disabled:opacity-50"
                    style={{ background: "#FF6B35", color: "white" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {deleting ? "MENGHAPUS..." : "YA, HAPUS"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function AdminUsers() {
  const { role } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  useEffect(() => {
    if (role === "admin") {
      supabase
        .from("profiles")
        .select("id, email, username, role, tier, plus_expires_at, downloads_today, created_at")
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
    setSelectedUser(prev => prev?.id === userId ? { ...prev, role: newRole } : prev);
  };

  const changeTier = async (userId: string, newTier: UserTier) => {
    const updates: Record<string, unknown> = { tier: newTier };
    if (newTier === "free") updates.plus_expires_at = null;
    await supabase.from("profiles").update(updates).eq("id", userId);
    setUsers(prev => prev.map(u => u.id === userId
      ? { ...u, tier: newTier, plus_expires_at: newTier === "free" ? null : u.plus_expires_at }
      : u));
    setSelectedUser(prev => prev?.id === userId
      ? { ...prev, tier: newTier, plus_expires_at: newTier === "free" ? null : prev.plus_expires_at }
      : prev);
  };

  const handleSetExpiry = async (userId: string, expiresAt: string | null) => {
    await supabase.from("profiles").update({ plus_expires_at: expiresAt }).eq("id", userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, plus_expires_at: expiresAt } : u));
    setSelectedUser(prev => prev?.id === userId ? { ...prev, plus_expires_at: expiresAt } : prev);
  };

  const handleDelete = async (userId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
    });
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      setSelectedUser(null);
    }
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.username ?? "").toLowerCase().includes(search.toLowerCase())
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
              placeholder="Cari email / username..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border-[3px] border-foreground px-3 py-1.5 font-mono text-sm focus:outline-none w-full sm:w-56"
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
                    <th className="text-left py-2 pr-3 font-black">TIER</th>
                    <th className="py-2 font-black text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr
                      key={u.id}
                      className={`border-b-[2px] border-foreground/10 hover:bg-secondary/50 ${selectedUser?.id === u.id ? "bg-secondary/70" : ""}`}
                    >
                      <td className="py-3 pr-4">
                        <div className="flex flex-col min-w-0">
                          <span className="truncate max-w-[160px] block" title={u.email}>{u.email}</span>
                          {u.username && (
                            <span className="text-[10px] opacity-40">@{u.username}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-3 opacity-50 whitespace-nowrap text-xs">
                        {fmtDate(u.created_at)}
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
                      <td className="py-3 pr-3">
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
                      <td className="py-3 text-center">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className={`border-[2px] border-foreground p-1.5 transition-all hover:shadow-[2px_2px_0_#0A0A0A] ${selectedUser?.id === u.id ? "shadow-[2px_2px_0_#0A0A0A]" : ""}`}
                          style={{ background: selectedUser?.id === u.id ? "#4DBBFF" : "transparent" }}
                          title={`Lihat detail ${u.email}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedUser && (
        <UserDrawer
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onRoleChange={changeRole}
          onTierChange={changeTier}
          onSetExpiry={handleSetExpiry}
          onDelete={handleDelete}
        />
      )}
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
