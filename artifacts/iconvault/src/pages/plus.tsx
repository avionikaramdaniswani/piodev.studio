import { Link } from "wouter";
import { Check, Sparkles, Zap, Download, Shield, Headphones, Star, Ticket } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { TierBadge } from "@/components/shared/TierBadge";
import { RedeemCodeBox } from "@/components/shared/RedeemCodeBox";

const FEATURES = [
  {
    icon: <Download className="w-5 h-5" />,
    title: "Unduh Tanpa Batas",
    desc: "Download ikon sebanyak yang kamu mau, kapan saja.",
    free: "50 unduhan/hari",
    plus: "Tidak terbatas",
  },
  {
    icon: <Star className="w-5 h-5" />,
    title: "Koleksi Eksklusif",
    desc: "Akses ratusan ikon Plus yang tidak tersedia di paket Free.",
    free: false,
    plus: true,
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Format Premium",
    desc: "Export ke PDF, WebP, dan format resolusi tinggi.",
    free: "SVG & PNG saja",
    plus: "SVG, PNG, PDF, WebP",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Lisensi Komersial",
    desc: "Pakai ikon untuk proyek klien dan produk berbayar.",
    free: "Personal saja",
    plus: "Personal & Komersial",
  },
  {
    icon: <Headphones className="w-5 h-5" />,
    title: "Dukungan Prioritas",
    desc: "Respon langsung dari tim PioDev via email.",
    free: false,
    plus: true,
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: "Fitur Baru Duluan",
    desc: "Akses beta fitur baru sebelum dirilis ke publik.",
    free: false,
    plus: true,
  },
];

export default function PlusPage() {
  const { user, tier, refreshProfile } = useAuth();
  const isPlus = tier === "plus";
  const isLoggedIn = !!user;

  return (
    <div className="max-w-4xl mx-auto py-10 flex flex-col gap-12">

      {/* Hero */}
      <div className="text-center flex flex-col items-center gap-4">
        <TierBadge tier="plus" size="md" />
        <h1 className="font-black text-5xl sm:text-6xl leading-none tracking-tight">
          TINGKATKAN<br />KE PLUS.
        </h1>
        <p className="font-mono text-base opacity-60 max-w-md">
          Akses penuh ke seluruh koleksi ikon, format premium, dan fitur eksklusif yang bikin kerjaan makin cepat.
        </p>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Free */}
        <div className="border-[3px] border-foreground p-7 flex flex-col gap-5">
          <div>
            <TierBadge tier="free" size="md" />
            <p className="font-black text-4xl mt-3">Gratis</p>
            <p className="font-mono text-xs opacity-50 mt-1">Untuk semua orang</p>
          </div>
          <ul className="flex flex-col gap-3 flex-1">
            {["10.000+ ikon SVG gratis", "50 unduhan per hari", "Semua developer tools", "Lisensi personal"].map(f => (
              <li key={f} className="flex items-center gap-3 font-mono text-sm opacity-70">
                <span className="w-5 h-5 border-[2px] border-foreground flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </span>
                {f}
              </li>
            ))}
          </ul>
          {!isLoggedIn ? (
            <Link href="/register" className="nb-btn py-3 font-black text-sm flex items-center justify-center" style={{ background: "white" }}>
              DAFTAR GRATIS
            </Link>
          ) : (
            <div className="nb-btn py-3 font-black text-sm flex items-center justify-center opacity-40 cursor-default" style={{ background: "white" }}>
              PAKET AKTIF KAMU
            </div>
          )}
        </div>

        {/* Plus */}
        <div className="border-[3px] border-foreground p-7 flex flex-col gap-5 shadow-[6px_6px_0_#0A0A0A]" style={{ background: "#FFE034" }}>
          <div>
            <TierBadge tier="plus" size="md" />
            <div className="flex items-end gap-1 mt-3">
              <p className="font-black text-4xl">Rp 49.000</p>
              <p className="font-mono text-sm mb-1 opacity-60">/bulan</p>
            </div>
            <p className="font-mono text-xs opacity-60 mt-1">Atau Rp 470.000/tahun · hemat 20%</p>
          </div>
          <ul className="flex flex-col gap-3 flex-1">
            {["Unduhan tidak terbatas", "Koleksi eksklusif Plus", "Format PDF, WebP, resolusi tinggi", "Lisensi personal & komersial", "Dukungan prioritas via email", "Akses beta fitur baru"].map(f => (
              <li key={f} className="flex items-center gap-3 font-mono text-sm font-bold">
                <span className="w-5 h-5 border-[2px] border-foreground flex items-center justify-center shrink-0" style={{ background: "#0A0A0A" }}>
                  <Check className="w-3 h-3 text-white" />
                </span>
                {f}
              </li>
            ))}
          </ul>
          {isPlus ? (
            <div className="nb-btn py-3 font-black text-sm flex items-center justify-center gap-2 opacity-60 cursor-default" style={{ background: "#0A0A0A", color: "white" }}>
              <Sparkles className="w-4 h-4" /> KAMU SUDAH PLUS!
            </div>
          ) : (
            <button
              className="nb-btn py-3 font-black text-sm flex items-center justify-center gap-2"
              style={{ background: "#0A0A0A", color: "white" }}
              onClick={() => alert("Sistem pembayaran segera hadir!")}
            >
              <Sparkles className="w-4 h-4" /> UPGRADE SEKARANG
            </button>
          )}
        </div>
      </div>

      {/* Feature comparison table */}
      <div className="flex flex-col gap-0 border-[3px] border-foreground overflow-hidden shadow-[4px_4px_0_#0A0A0A]">
        <div className="grid grid-cols-[1fr_120px_120px] bg-foreground text-background">
          <div className="p-4 font-black text-sm">FITUR</div>
          <div className="p-4 font-black text-sm text-center border-l-[2px] border-background/20">FREE</div>
          <div className="p-4 font-black text-sm text-center border-l-[2px] border-background/20 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" /> PLUS
          </div>
        </div>
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className={`grid grid-cols-[1fr_120px_120px] border-t-[2px] border-foreground ${i % 2 === 1 ? "bg-secondary/30" : ""}`}
          >
            <div className="p-4 flex items-start gap-3">
              <div className="opacity-40 mt-0.5 shrink-0">{f.icon}</div>
              <div>
                <p className="font-black text-sm">{f.title}</p>
                <p className="font-mono text-xs opacity-50">{f.desc}</p>
              </div>
            </div>
            <div className="p-4 border-l-[2px] border-foreground/20 flex items-center justify-center">
              {f.free === false ? (
                <span className="font-mono text-xs opacity-30">—</span>
              ) : f.free === true ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="font-mono text-xs text-center opacity-60">{f.free}</span>
              )}
            </div>
            <div className="p-4 border-l-[2px] border-foreground/20 flex items-center justify-center" style={{ background: "#FFE03422" }}>
              {f.plus === true ? (
                <span className="w-5 h-5 border-[2px] border-foreground flex items-center justify-center" style={{ background: "#FFE034" }}>
                  <Check className="w-3 h-3" />
                </span>
              ) : (
                <span className="font-mono text-xs text-center font-bold">{f.plus as string}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Redeem code section */}
      {isLoggedIn && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b-[3px] border-foreground pb-3">
            <Ticket className="w-5 h-5 opacity-60" />
            <div>
              <p className="font-black text-lg">PUNYA KODE PLUS?</p>
              <p className="font-mono text-xs opacity-50">Aktifkan langsung di sini tanpa perlu ke halaman profil.</p>
            </div>
          </div>
          <RedeemCodeBox onSuccess={refreshProfile} />
        </div>
      )}

      {!isLoggedIn && (
        <div className="border-[3px] border-foreground p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Ticket className="w-5 h-5 opacity-40" />
            <div>
              <p className="font-black">PUNYA KODE PLUS?</p>
              <p className="font-mono text-xs opacity-50">Login dulu untuk redeem kode Plus kamu.</p>
            </div>
          </div>
          <Link
            href="/login"
            className="nb-btn py-2.5 px-6 font-black text-sm flex items-center gap-2 whitespace-nowrap"
            style={{ background: "#4DBBFF" }}
          >
            LOGIN UNTUK REDEEM
          </Link>
        </div>
      )}

      {/* CTA bottom */}
      {!isPlus && (
        <div className="border-[3px] border-foreground p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[4px_4px_0_#0A0A0A]" style={{ background: "#FFE034" }}>
          <div>
            <p className="font-black text-2xl">Siap upgrade?</p>
            <p className="font-mono text-sm opacity-70 mt-1">Mulai dengan Rp 49.000/bulan. Bisa batal kapan saja.</p>
          </div>
          <button
            className="nb-btn py-3 px-8 font-black flex items-center gap-2 whitespace-nowrap"
            style={{ background: "#0A0A0A", color: "white" }}
            onClick={() => alert("Sistem pembayaran segera hadir!")}
          >
            <Sparkles className="w-5 h-5" /> UPGRADE KE PLUS
          </button>
        </div>
      )}
    </div>
  );
}
