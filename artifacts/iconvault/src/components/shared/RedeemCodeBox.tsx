import { useState } from "react";
import { Ticket, ArrowRight, Sparkles, X, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface RedeemResult {
  plusExpiresAt?: string;
  durationDays?: number;
}

function SuccessModal({ result, onClose }: { result: RedeemResult; onClose: () => void }) {
  const expiry = result.plusExpiresAt
    ? new Date(result.plusExpiresAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        className="relative w-full max-w-sm border-[4px] border-foreground shadow-[8px_8px_0_#0A0A0A] flex flex-col items-center gap-0 overflow-hidden z-10"
        style={{ background: "#FFE034" }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-full flex flex-col items-center gap-5 px-8 pt-10 pb-8">
          <div className="relative">
            <div
              className="w-20 h-20 border-[4px] border-foreground shadow-[4px_4px_0_#0A0A0A] flex items-center justify-center"
              style={{ background: "#0A0A0A" }}
            >
              <Sparkles className="w-9 h-9 text-yellow-300" />
            </div>
            <div className="absolute -top-2 -right-2 w-7 h-7 border-[3px] border-foreground flex items-center justify-center" style={{ background: "#00E676" }}>
              <Star className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="text-center">
            <p className="font-black text-2xl leading-tight tracking-tight">SELAMAT!</p>
            <p className="font-black text-lg leading-snug">KAMU SEKARANG PLUS ✦</p>
          </div>

          <div
            className="w-full border-[3px] border-foreground p-4 flex flex-col gap-1 text-center"
            style={{ background: "white" }}
          >
            <p className="font-mono text-[10px] opacity-50 font-bold">PLUS AKTIF HINGGA</p>
            <p className="font-black text-xl">
              {expiry ?? `${result.durationDays ?? 30} hari ke depan`}
            </p>
          </div>

          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center gap-2 font-mono text-xs font-bold opacity-60">
              <Ticket className="w-3.5 h-3.5 shrink-0" />
              Kode berhasil digunakan dan sekarang tidak aktif
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full nb-btn py-3 font-black text-sm flex items-center justify-center gap-2"
            style={{ background: "#0A0A0A", color: "white" }}
          >
            <Sparkles className="w-4 h-4" /> NIKMATI PLUS!
          </button>
        </div>
      </div>
    </div>
  );
}

export function RedeemCodeBox({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successResult, setSuccessResult] = useState<RedeemResult | null>(null);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError("");
    setSuccessResult(null);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json() as { success?: boolean; plusExpiresAt?: string; durationDays?: number; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Kode tidak valid.");
      } else {
        setCode("");
        setSuccessResult({ plusExpiresAt: data.plusExpiresAt, durationDays: data.durationDays });
        onSuccess();
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    }
    setLoading(false);
  };

  const handleCloseModal = () => setSuccessResult(null);

  return (
    <>
      {successResult && (
        <SuccessModal result={successResult} onClose={handleCloseModal} />
      )}

      <div className="border-[3px] border-foreground p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b-[2px] border-foreground/10 pb-3">
          <Ticket className="w-4 h-4 opacity-60" />
          <p className="font-black text-sm">REDEEM KODE PLUS</p>
        </div>
        <p className="font-mono text-xs opacity-50">
          Punya kode dari langganan pio.codes? Masukkan di sini untuk aktifkan Plus.
        </p>

        {error && (
          <div className="p-3 border-[2px] font-mono text-xs font-bold" style={{ borderColor: "#FF6B35", background: "#FFF3EF", color: "#FF6B35" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRedeem} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="PIODEV-XXXX-XXXX-XXXX"
            className="nb-input flex-1 px-3 py-2.5 text-sm font-mono tracking-wider uppercase"
            disabled={loading}
            maxLength={24}
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="nb-btn px-4 py-2.5 font-black text-sm flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
            style={{ background: "#FFE034" }}
          >
            {loading ? "..." : <><ArrowRight className="w-4 h-4" /> PAKAI</>}
          </button>
        </form>
      </div>
    </>
  );
}
