import { useEffect, useState } from "react";
import { BarChart2, Download, Heart, Grid, Upload, Users, Sparkles, ChevronRight, Shield, TrendingUp, Package } from "lucide-react";
import { Link } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useGetIconStats } from "@workspace/api-client-react";
import { supabase } from "@/lib/supabase";

const ACCENT_COLORS = ["#FFE034", "#FF6B9D", "#4DBBFF", "#00E676", "#FF6B35", "#A78BFA", "#FB923C", "#34D399"];

interface AnalyticsData {
  topIcons: Array<{ id: number; name: string; slug: string; category: string; downloads: number; likes: number }>;
  categoryDist: Array<{ category: string; count: number; totalDownloads: number }>;
  tierDist: Array<{ tier: string; count: number }>;
  iconsByMonth: Array<{ month: string; count: number }>;
  totals: { totalIcons: number; totalDownloads: number; totalLikes: number; featuredCount: number };
}

function NbTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-[3px] border-foreground shadow-[4px_4px_0_#0A0A0A] bg-card px-3 py-2">
      {label && <p className="font-black text-xs mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="font-mono text-xs font-bold" style={{ color: entry.color ?? "#0A0A0A" }}>
          {entry.name ? `${entry.name}: ` : ""}{entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

function NbPieLabel({ cx, cy, midAngle, outerRadius, percent }: { cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number }) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = outerRadius + 18;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className="font-mono" style={{ fontSize: 11, fontWeight: 700, fill: "#0A0A0A" }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function useAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchAnalytics() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch("/api/admin/analytics", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json() as AnalyticsData;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAnalytics();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="nb-card p-5">
      <h3 className="font-black text-sm mb-4 border-b-[3px] border-foreground pb-3 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function SkeletonChart({ height = 180 }: { height?: number }) {
  return (
    <div className="animate-pulse border-[3px] border-foreground/20" style={{ height, background: "#f5f5f5" }} />
  );
}

function AdminDashboard() {
  const { role } = useAuth();
  const { data: stats } = useGetIconStats();
  const { data: analytics, loading, error } = useAnalytics();

  const STATS = [
    { label: "TOTAL IKON", value: stats?.totalIcons ?? "–", icon: <Grid className="w-6 h-6" />, bg: "#FFE034" },
    { label: "TOTAL UNDUHAN", value: stats?.totalDownloads ?? "–", icon: <Download className="w-6 h-6" />, bg: "#FF6B9D" },
    { label: "TOTAL SUKA", value: stats?.totalLikes ?? "–", icon: <Heart className="w-6 h-6" />, bg: "#4DBBFF" },
    { label: "PENGGUNA PLUS", value: stats?.plusUsers ?? "–", icon: <Sparkles className="w-6 h-6" />, bg: "#00E676" },
  ];

  const QUICK_ACTIONS = [
    { href: "/admin/upload", label: "UPLOAD IKON BARU", desc: "Tambah ikon ke koleksi", icon: Upload, bg: "#00E676" },
    { href: "/admin/icons", label: "KELOLA SEMUA IKON", desc: "Edit, hapus, kelola ikon", icon: Grid, bg: "#4DBBFF" },
    ...(role === "admin" ? [{ href: "/admin/users", label: "KELOLA PENGGUNA", desc: "Atur role & tier user", icon: Users, bg: "#FF6B9D" }] : []),
  ];

  const topIconsData = analytics?.topIcons.map(icon => ({
    name: icon.name.length > 14 ? icon.name.slice(0, 14) + "…" : icon.name,
    fullName: icon.name,
    downloads: icon.downloads,
    likes: icon.likes,
  })) ?? [];

  const categoryData = analytics?.categoryDist.map((c, i) => ({
    name: c.category,
    ikon: c.count,
    unduhan: c.totalDownloads,
    fill: ACCENT_COLORS[i % ACCENT_COLORS.length],
  })) ?? [];

  const tierData = (analytics?.tierDist ?? []).map((t, i) => ({
    name: t.tier === "plus" ? "PLUS" : "FREE",
    value: t.count,
    fill: t.tier === "plus" ? "#FFE034" : "#4DBBFF",
  }));

  const monthData = analytics?.iconsByMonth.map(m => ({
    name: m.month,
    ikon: m.count,
  })) ?? [];

  return (
    <AdminLayout title="DASHBOARD">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b-[4px] border-foreground pb-4">
          <Shield className="w-7 h-7" />
          <div>
            <h1 className="font-black text-2xl">DASHBOARD</h1>
            <p className="font-mono text-xs opacity-50">Selamat datang di Panel Admin IconVault</p>
          </div>
        </div>

        {/* Stat cards */}
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

        {/* ── Analytics section ── */}
        {error ? (
          <div className="nb-card p-5 border-[3px]" style={{ borderColor: "#FF6B35", background: "#FFF3EF" }}>
            <p className="font-black text-sm" style={{ color: "#FF6B35" }}>Gagal memuat data analytics: {error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Top 10 ikon by downloads */}
            <ChartCard title="🏆 Top 10 Ikon — Unduhan Terbanyak">
              {loading ? <SkeletonChart height={260} /> : topIconsData.length === 0 ? (
                <p className="font-mono text-sm opacity-50 text-center py-10">Belum ada data unduhan</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topIconsData} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, fontWeight: 700 }} axisLine={{ stroke: "#0A0A0A", strokeWidth: 2 }} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<NbTooltip />} cursor={{ fill: "#0A0A0A10" }} />
                    <Bar dataKey="downloads" name="Unduhan" radius={0} maxBarSize={22}>
                      {topIconsData.map((_, i) => (
                        <Cell key={i} fill={ACCENT_COLORS[i % ACCENT_COLORS.length]} stroke="#0A0A0A" strokeWidth={2} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Distribusi kategori */}
            <ChartCard title="📂 Distribusi Kategori">
              {loading ? <SkeletonChart height={260} /> : categoryData.length === 0 ? (
                <p className="font-mono text-sm opacity-50 text-center py-10">Belum ada data kategori</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={categoryData} margin={{ left: 0, right: 8, top: 0, bottom: 40 }}>
                    <XAxis dataKey="name" tick={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, fontWeight: 700, fill: "#0A0A0A" }} axisLine={{ stroke: "#0A0A0A", strokeWidth: 2 }} tickLine={false} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<NbTooltip />} cursor={{ fill: "#0A0A0A10" }} />
                    <Bar dataKey="ikon" name="Ikon" radius={0} maxBarSize={40}>
                      {categoryData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} stroke="#0A0A0A" strokeWidth={2} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Upload ikon per bulan */}
            <ChartCard title="📈 Ikon Baru per Bulan (12 Bulan Terakhir)">
              {loading ? <SkeletonChart height={200} /> : monthData.length === 0 ? (
                <p className="font-mono text-sm opacity-50 text-center py-10">Belum ada data upload bulanan</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, fontWeight: 700 }} axisLine={{ stroke: "#0A0A0A", strokeWidth: 2 }} tickLine={false} />
                    <YAxis tick={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<NbTooltip />} cursor={{ fill: "#0A0A0A10" }} />
                    <Bar dataKey="ikon" name="Ikon baru" fill="#FFE034" stroke="#0A0A0A" strokeWidth={2} radius={0} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* User tier split */}
            <ChartCard title="👥 Komposisi Pengguna (Free vs Plus)">
              {loading ? <SkeletonChart height={200} /> : tierData.length === 0 ? (
                <p className="font-mono text-sm opacity-50 text-center py-10">Belum ada data pengguna</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={tierData}
                      cx="50%"
                      cy="50%"
                      outerRadius={72}
                      dataKey="value"
                      labelLine={false}
                      label={NbPieLabel as never}
                      strokeWidth={3}
                      stroke="#0A0A0A"
                    >
                      {tierData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend
                      formatter={(value) => (
                        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 700, color: "#0A0A0A" }}>{value}</span>
                      )}
                    />
                    <Tooltip content={<NbTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

          </div>
        )}

        {/* Extra insight strip */}
        {analytics && !loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "IKON FEATURED", value: analytics.totals.featuredCount, icon: <Sparkles className="w-4 h-4" />, bg: "#FF6B9D" },
              { label: "TOTAL KATEGORI", value: analytics.categoryDist.length, icon: <Grid className="w-4 h-4" />, bg: "#4DBBFF" },
              { label: "RATA-RATA UNDUHAN", value: analytics.totals.totalIcons > 0 ? Math.round(analytics.totals.totalDownloads / analytics.totals.totalIcons) : 0, icon: <TrendingUp className="w-4 h-4" />, bg: "#FFE034" },
              { label: "IKON BULAN INI", value: analytics.iconsByMonth.at(-1)?.count ?? 0, icon: <Package className="w-4 h-4" />, bg: "#00E676" },
            ].map(s => (
              <div key={s.label} className="border-[3px] border-foreground p-4 shadow-[3px_3px_0_#0A0A0A]" style={{ background: s.bg }}>
                <div className="flex items-center gap-2 mb-1 opacity-70">{s.icon}</div>
                <p className="font-mono text-[10px] font-bold opacity-70 mb-0.5">{s.label}</p>
                <p className="font-black text-2xl">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quick actions */}
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
