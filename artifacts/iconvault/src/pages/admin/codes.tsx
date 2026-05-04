import { useEffect, useState, useCallback } from "react";
import { Ticket, Plus, Trash2, Copy, Check, RefreshCw } from "lucide-react";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface RedeemCode {
  id: string;
  code: string;
  label: string | null;
  duration_days: number;
  expires_at: string | null;
  redeemed_by: string | null;
  redeemed_at: string | null;
  created_at: string;
}

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${session?.access_token ?? ""}`, "Content-Type": "application/json" };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="opacity-40 hover:opacity-100 transition-opacity ml-1" title="Salin kode">
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function GenerateModal({ onClose, onGenerated }: { onClose: () => void; onGenerated: () => void }) {
  const [count, setCount] = useState(1);
  const [label, setLabel] = useState("");
  const [durationDays, setDurationDays] = useState(30);
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/codes/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          count,
          label: label.trim() || undefined,
          durationDays,
          expiresAt: expiresAt || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Gagal generate kode.");
        setLoading(false);
        return;
      }
      onGenerated();
      onClose();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md nb-card p-6 flex flex-col gap-5 z-10">
        <div className="flex items-center justify-between border-b-[3px] border-foreground pb-4">
          <h2 className="font-black text-lg flex items-center gap-2">
            <Ticket className="w-5 h-5" /> GENERATE KODE
          </h2>
        </div>

        {error && (
          <div className="p-3 border-[2px] font-mono text-xs font-bold" style={{ borderColor: "#FF6B35", background: "#FFF3EF", color: "#FF6B35" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-black text-xs mb-1.5">JUMLAH KODE</label>
              <input
                type="number"
                min={1}
                max={50}
                value={count}
                onChange={e => setCount(Number(e.target.value))}
                className="nb-input w-full px-3 py-2 text-sm"
              />
              <p className="font-mono text-[10px] opacity-40 mt-1">Maks. 50 sekaligus</p>
            </div>
            <div>
              <label className="block font-black text-xs mb-1.5">DURASI PLUS</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={durationDays}
                  onChange={e => setDurationDays(Number(e.target.value))}
                  className="nb-input w-full px-3 py-2 text-sm"
                />
                <span className="font-mono text-xs opacity-50 whitespace-nowrap">hari</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-black text-xs mb-1.5">LABEL / CATATAN <span className="font-mono opacity-40">(opsional)</span></label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder='misal: "kode untuk si A"'
              className="nb-input w-full px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block font-black text-xs mb-1.5">KEDALUWARSA KODE <span className="font-mono opacity-40">(opsional)</span></label>
            <input
              type="date"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              className="nb-input w-full px-3 py-2 text-sm"
              min={new Date().toISOString().split("T")[0]}
            />
            <p className="font-mono text-[10px] opacity-40 mt-1">Kosongkan jika tidak ada batas waktu penggunaan kode</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 nb-btn py-2.5 font-black text-sm"
              style={{ background: "white" }}
            >
              BATAL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 nb-btn py-2.5 font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: "#00E676" }}
            >
              <Plus className="w-4 h-4" />
              {loading ? "GENERATING..." : `GENERATE ${count} KODE`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminCodes() {
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/codes", { headers });
      if (res.ok) {
        const data = await res.json() as RedeemCode[];
        setCodes(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kode ini?")) return;
    setDeletingId(id);
    const headers = await getAuthHeaders();
    await fetch(`/api/admin/codes/${id}`, { method: "DELETE", headers });
    setCodes(prev => prev.filter(c => c.id !== id));
    setDeletingId(null);
  };

  const total = codes.length;
  const redeemed = codes.filter(c => c.redeemed_by).length;
  const available = total - redeemed;

  const formatDate = (iso: string | null) => {
    if (!iso) return "–";
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  const isExpired = (c: RedeemCode) =>
    !c.redeemed_by && c.expires_at && new Date() > new Date(c.expires_at);

  return (
    <AdminLayout title="REDEEM CODES">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between border-b-[4px] border-foreground pb-4">
          <div className="flex items-center gap-3">
            <Ticket className="w-7 h-7" />
            <div>
              <h1 className="font-black text-2xl">REDEEM CODES</h1>
              <p className="font-mono text-xs opacity-50">Kelola kode Plus untuk pengguna pio.codes</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="nb-btn px-4 py-2.5 font-black text-sm flex items-center gap-2"
            style={{ background: "#00E676" }}
          >
            <Plus className="w-4 h-4" /> GENERATE KODE
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "TOTAL KODE", value: total, bg: "#FFE034" },
            { label: "TERSEDIA", value: available, bg: "#00E676" },
            { label: "SUDAH DIPAKAI", value: redeemed, bg: "#FF6B9D" },
          ].map(s => (
            <div key={s.label} className="nb-card p-4" style={{ background: s.bg }}>
              <p className="font-mono text-xs font-bold opacity-70 mb-1">{s.label}</p>
              <p className="font-black text-2xl">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="nb-card p-6">
          <div className="flex items-center justify-between mb-4 border-b-[3px] border-foreground pb-4">
            <h2 className="font-black text-lg flex items-center gap-2">
              <Ticket className="w-5 h-5" /> DAFTAR KODE
            </h2>
            <button
              onClick={fetchCodes}
              className="border-[2px] border-foreground p-1.5 hover:bg-secondary transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 bg-muted animate-pulse border-[2px] border-foreground" />
              ))}
            </div>
          ) : codes.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center gap-3">
              <Ticket className="w-10 h-10 opacity-20" />
              <p className="font-mono text-sm opacity-50">Belum ada kode. Klik "Generate Kode" untuk mulai.</p>
            </div>
          ) : (
            <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="border-b-[3px] border-foreground">
                    <th className="text-left py-2 pr-4 font-black">KODE</th>
                    <th className="text-left py-2 pr-3 font-black">LABEL</th>
                    <th className="text-left py-2 pr-3 font-black whitespace-nowrap">DURASI</th>
                    <th className="text-left py-2 pr-3 font-black whitespace-nowrap">KEDALUWARSA</th>
                    <th className="text-left py-2 pr-3 font-black">STATUS</th>
                    <th className="text-left py-2 font-black">DIPAKAI</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {codes.map(c => {
                    const expired = isExpired(c);
                    return (
                      <tr key={c.id} className="border-b-[2px] border-foreground/10 hover:bg-secondary/50">
                        <td className="py-3 pr-4">
                          <div className="flex items-center">
                            <span
                              className="font-black text-xs px-2 py-1 border-[2px] border-foreground tracking-widest"
                              style={{ background: c.redeemed_by ? "#e5e5e5" : "#FFE034", color: "#0A0A0A" }}
                            >
                              {c.code}
                            </span>
                            {!c.redeemed_by && <CopyButton text={c.code} />}
                          </div>
                        </td>
                        <td className="py-3 pr-3 max-w-[120px]">
                          <span className="opacity-70 truncate block" title={c.label ?? ""}>
                            {c.label ?? <span className="opacity-30 italic">–</span>}
                          </span>
                        </td>
                        <td className="py-3 pr-3 whitespace-nowrap opacity-70">{c.duration_days} hari</td>
                        <td className="py-3 pr-3 whitespace-nowrap opacity-70">{formatDate(c.expires_at)}</td>
                        <td className="py-3 pr-3">
                          {c.redeemed_by ? (
                            <span className="font-black text-xs px-2 py-1 border-[2px] border-foreground" style={{ background: "#4DBBFF" }}>
                              DIPAKAI
                            </span>
                          ) : expired ? (
                            <span className="font-black text-xs px-2 py-1 border-[2px] border-foreground" style={{ background: "#FF6B35", color: "white" }}>
                              KEDALUWARSA
                            </span>
                          ) : (
                            <span className="font-black text-xs px-2 py-1 border-[2px] border-foreground" style={{ background: "#00E676" }}>
                              AKTIF
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-3 opacity-50 whitespace-nowrap text-xs">
                          {formatDate(c.redeemed_at)}
                        </td>
                        <td className="py-3">
                          {!c.redeemed_by && (
                            <button
                              onClick={() => handleDelete(c.id)}
                              disabled={deletingId === c.id}
                              className="opacity-40 hover:opacity-100 transition-opacity disabled:opacity-20"
                              title="Hapus kode"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <GenerateModal
          onClose={() => setShowModal(false)}
          onGenerated={fetchCodes}
        />
      )}
    </AdminLayout>
  );
}

export default function AdminCodesPage() {
  return (
    <RoleGuard requiredRole="admin">
      <AdminCodes />
    </RoleGuard>
  );
}
