import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { Download, Copy, Heart, Hash, Layers, Tag, ExternalLink, Code2, Sparkles, UserPlus, X } from "lucide-react";

import { useGetIconBySlug, useDownloadIcon, useToggleLike, useGetSimilarIcons } from "@workspace/api-client-react";

import { useToast } from "@/hooks/use-toast";
import { IconCard } from "@/components/shared/IconCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const ACCENT_COLORS = ['#FFE034', '#FF6B9D', '#4DBBFF', '#00E676', '#FF6B35'];

export default function IconDetail() {
  const [, params] = useRoute("/icons/:slug");
  const slug = params?.slug || "";

  const { data: icon, isLoading, error } = useGetIconBySlug(slug);
  const { data: similarIcons } = useGetSimilarIcons(icon?.id || 0, { query: { enabled: !!icon?.id } });

  const { toast } = useToast();
  const downloadMutation = useDownloadIcon();
  const likeMutation = useToggleLike();

  const [, navigate] = useLocation();
  const { user, tier, downloadsToday, quotaLimit, refreshProfile } = useAuth();

  const [likes, setLikes] = useState(0);
  const [iconColor, setIconColor] = useState("#0A0A0A");
  const [downloading, setDownloading] = useState(false);
  const [showAnonLimitModal, setShowAnonLimitModal] = useState(false);

  const accentColor = icon ? ACCENT_COLORS[icon.id % ACCENT_COLORS.length] : ACCENT_COLORS[0];

  // Use dark bg when icon color is too light to see on white
  function isLight(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 180;
  }
  const previewBg = isLight(iconColor) ? "#0A0A0A" : "#FFFFFF";

  const PRESET_COLORS = [
    "#0A0A0A", "#FFFFFF", "#FF0000", "#FF6B35",
    "#FFE034", "#00E676", "#4DBBFF", "#7C3AED",
    "#FF6B9D", "#FF6B6B", "#06B6D4", "#F59E0B",
  ];

  if (icon && likes === 0 && icon.likes > 0) {
    setLikes(icon.likes);
  }

  const handleDownload = async () => {
    if (!icon || downloading) return;
    setDownloading(true);

    try {
      // Get JWT for authenticated request (optional — anon users still can download)
      const { data: { session: s } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (s?.access_token) headers["Authorization"] = `Bearer ${s.access_token}`;

      const res = await fetch(`/api/icons/${icon.id}/download`, {
        method: "POST",
        headers,
      });

      if (res.status === 429) {
        const data = await res.json() as { quota: number; used: number; reason?: string };
        setDownloading(false);
        if (data.reason === "anon_quota_exceeded") {
          // Anonymous user hit their daily limit — show sign-up CTA modal
          setShowAnonLimitModal(true);
        } else {
          // Logged-in free user hit their daily limit
          toast({
            title: "KUOTA HABIS!",
            description: `Kamu sudah mencapai batas ${data.quota} unduhan hari ini. Reset otomatis tengah malam, atau upgrade ke Plus.`,
            className: "border-[3px] border-foreground rounded-none font-bold shadow-[4px_4px_0_#0A0A0A]",
            style: { background: "#FF6B35", color: "white" },
          });
        }
        return;
      }

      if (!res.ok) {
        setDownloading(false);
        toast({
          title: "GAGAL",
          description: "Terjadi kesalahan. Coba lagi.",
          className: "border-[3px] border-foreground rounded-none bg-white font-bold shadow-[4px_4px_0_#0A0A0A]",
        });
        return;
      }

      // Refresh profile quota display
      if (user) await refreshProfile();

      // Apply selected color to the SVG being downloaded.
      // Strategy: replace all fill/stroke attribute values (except "none") with the chosen color,
      // then also replace currentColor references and inject a root style.
      const coloredSvg = icon.svgContent
        // Replace currentColor keyword
        .replace(/currentColor/gi, iconColor)
        // Replace hardcoded fill colors (e.g. fill="#000", fill="black") but keep fill="none"
        .replace(/\bfill="(?!none\b)([^"]*)"/gi, `fill="${iconColor}"`)
        // Replace hardcoded stroke colors (e.g. stroke="#000") but keep stroke="none"
        .replace(/\bstroke="(?!none\b)([^"]*)"/gi, `stroke="${iconColor}"`)
        // Replace inline style fill/stroke declarations
        .replace(/\bfill:\s*(?!none\b)[^;"}]*/gi, `fill:${iconColor}`)
        .replace(/\bstroke:\s*(?!none\b)[^;"}]*/gi, `stroke:${iconColor}`)
        // Update the root <svg> element style
        .replace(/<svg([^>]*)>/, (_match, attrs) => {
          const cleaned = attrs.replace(/\s*style="[^"]*"/i, "");
          return `<svg${cleaned} style="color:${iconColor}">`;
        });

      // Trigger the actual file download
      const blob = new Blob([coloredSvg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${icon.slug}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const isPlus = tier === "plus";
      const remaining = isPlus ? "∞" : String(quotaLimit - downloadsToday - 1);

      if (!user) {
        // Anonymous download — read remaining from response
        const downloadData = await res.json().catch(() => null) as { used?: number } | null;
        const used = downloadData?.used ?? 1;
        const anonRemaining = 5 - used;
        toast({
          title: "DIUNDUH!",
          description: anonRemaining > 0
            ? `${icon.name} diunduh. Sisa ${anonRemaining} unduhan gratis hari ini — daftar untuk dapat 50/hari!`
            : `${icon.name} diunduh. Kuota tamu habis, daftar gratis untuk lanjut!`,
          className: "border-[3px] border-foreground rounded-none bg-primary text-primary-foreground font-bold shadow-[4px_4px_0_#0A0A0A]",
        });
      } else {
        toast({
          title: "DIUNDUH!",
          description: isPlus
            ? `${icon.name} berhasil diunduh.`
            : `${icon.name} diunduh. Sisa kuota hari ini: ${remaining}`,
          className: "border-[3px] border-foreground rounded-none bg-primary text-primary-foreground font-bold shadow-[4px_4px_0_#0A0A0A]",
        });
      }
    } catch {
      toast({
        title: "GAGAL",
        description: "Tidak bisa terhubung ke server. Coba lagi.",
        className: "border-[3px] border-foreground rounded-none bg-white font-bold shadow-[4px_4px_0_#0A0A0A]",
      });
    }

    setDownloading(false);
  };

  const handleCopy = () => {
    if (!icon) return;
    navigator.clipboard.writeText(icon.svgContent);
    toast({
      title: "DISALIN!",
      description: "Kode SVG berhasil disalin ke clipboard.",
      className: "border-[3px] border-foreground rounded-none bg-[#4DBBFF] text-primary-foreground font-bold shadow-[4px_4px_0_#0A0A0A]",
    });
  };

  const handleLike = () => {
    if (!icon) return;
    likeMutation.mutate({ id: icon.id }, {
      onSuccess: (data) => setLikes(data.likes),
    });
  };

  // Quota state for UI hints
  const isPlus = tier === "plus";
  const quotaExhausted = !isPlus && user && quotaLimit > 0 && downloadsToday >= quotaLimit;
  const quotaLow = !isPlus && user && !quotaExhausted && (quotaLimit - downloadsToday) <= 10;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-2xl font-black animate-pulse">MEMUAT IKON...</div>
      </div>
    );
  }

  if (error || !icon) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h1 className="text-6xl font-black mb-4">IKON TIDAK DITEMUKAN</h1>
        <p className="font-mono mb-8">Ikon ini tidak ada atau sudah dihapus.</p>
        <Link href="/icons" className="nb-btn bg-primary">LIHAT SEMUA IKON</Link>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-6xl mx-auto">
      {/* Anonymous limit reached modal */}
      {showAnonLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(10,10,10,0.7)" }}>
          <div className="relative w-full max-w-md border-[4px] border-foreground bg-background shadow-[8px_8px_0_#0A0A0A]">
            <button
              onClick={() => setShowAnonLimitModal(false)}
              className="absolute top-3 right-3 p-1 hover:opacity-60"
            >
              <X className="w-5 h-5" />
            </button>
            {/* Accent strip */}
            <div className="h-3 w-full border-b-[3px] border-foreground" style={{ background: "#FFE034" }} />
            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 border-[3px] border-foreground" style={{ background: "#FFE034" }}>
                  <Download className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black leading-tight">BATAS UNDUHAN TAMU HABIS!</h2>
              </div>
              <p className="font-mono text-sm mb-2 opacity-70">
                Kamu sudah menggunakan <strong>5/5 unduhan gratis</strong> hari ini sebagai tamu.
              </p>
              <div className="border-[3px] border-foreground p-4 mb-6" style={{ background: "#F0FFF4" }}>
                <p className="font-black text-sm mb-1">Daftar gratis dan dapatkan:</p>
                <ul className="font-mono text-sm space-y-1">
                  <li>✓ <strong>50 unduhan/hari</strong> (10× lebih banyak)</li>
                  <li>✓ Riwayat unduhan pribadi</li>
                  <li>✓ Akses fitur eksklusif member</li>
                </ul>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { setShowAnonLimitModal(false); navigate("/register"); }}
                  className="nb-btn w-full py-3 font-black text-base flex items-center justify-center gap-2"
                  style={{ background: "#FFE034" }}
                >
                  <UserPlus className="w-5 h-5" />
                  DAFTAR GRATIS SEKARANG
                </button>
                <button
                  onClick={() => { setShowAnonLimitModal(false); navigate("/login"); }}
                  className="nb-btn w-full py-3 font-black text-base flex items-center justify-center gap-2 bg-card"
                >
                  Sudah punya akun? MASUK
                </button>
                <button
                  onClick={() => setShowAnonLimitModal(false)}
                  className="text-center font-mono text-xs opacity-50 hover:opacity-80 underline"
                >
                  Tutup, coba lagi besok
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Link href="/icons" className="inline-flex items-center gap-2 font-bold mb-8 hover:underline decoration-4">
        ← KEMBALI KE IKON
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
        {/* Preview Area */}
        <div className="flex flex-col gap-4">
          <div className="nb-card overflow-hidden">
            {/* Accent strip — same pattern as IconCard */}
            <div className="h-4 w-full border-b-[3px] border-foreground" style={{ backgroundColor: accentColor }} />
            <div
              className="flex items-center justify-center p-12 h-64 transition-colors duration-300"
              style={{ backgroundColor: previewBg, color: iconColor }}
            >
              <div
                className="w-full h-full max-w-[160px] max-h-[160px] [&>svg]:w-full [&>svg]:h-full [&>svg]:stroke-current [&>svg_*]:stroke-current"
                dangerouslySetInnerHTML={{ __html: icon.svgContent }}
              />
            </div>
          </div>

          {/* Color picker */}
          <div className="nb-card p-3">
            <p className="font-mono text-[10px] font-bold opacity-50 mb-2">WARNA IKON</p>
            <div className="flex flex-wrap gap-2 items-center">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setIconColor(c)}
                  title={c}
                  className="w-8 h-8 border-[2px] border-foreground shadow-[2px_2px_0_#0A0A0A] transition-transform hover:scale-110 shrink-0"
                  style={{
                    backgroundColor: c,
                    outline: iconColor === c ? "3px solid #0A0A0A" : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
              {/* Accent color shortcut */}
              <button
                onClick={() => setIconColor(accentColor)}
                title="Warna aksen ikon ini"
                className="w-8 h-8 border-[2px] border-foreground shadow-[2px_2px_0_#0A0A0A] transition-transform hover:scale-110 shrink-0 font-black text-[9px] flex items-center justify-center"
                style={{
                  backgroundColor: accentColor,
                  outline: iconColor === accentColor ? "3px solid #0A0A0A" : "none",
                  outlineOffset: "2px",
                }}
              >
                ★
              </button>
              {/* Custom color picker */}
              <label
                className="w-8 h-8 border-[2px] border-foreground shadow-[2px_2px_0_#0A0A0A] cursor-pointer flex items-center justify-center text-lg hover:scale-110 transition-transform shrink-0"
                title="Pilih warna custom"
                style={{ background: "linear-gradient(135deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f)" }}
              >
                <input
                  type="color"
                  className="opacity-0 absolute w-0 h-0"
                  value={iconColor}
                  onChange={e => setIconColor(e.target.value)}
                />
              </label>
              <span className="font-mono text-xs font-bold ml-1 opacity-60 uppercase">{iconColor}</span>
            </div>
          </div>
        </div>

        {/* Details Area */}
        <div className="flex flex-col justify-center">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-5xl lg:text-6xl font-black uppercase break-all leading-tight">{icon.name}</h1>
            <button
              onClick={handleLike}
              className="nb-btn bg-accent py-3 px-4 flex items-center gap-2 group ml-4 shrink-0"
              title="Suka ikon ini"
            >
              <Heart className={`w-6 h-6 ${likes > icon.likes ? 'fill-foreground' : 'group-hover:fill-foreground/20'}`} />
              <span className="text-xl">{likes || icon.likes}</span>
            </button>
          </div>

          {icon.description && (
            <p className="text-lg font-medium mb-6 opacity-80">{icon.description}</p>
          )}

          <div className="flex flex-wrap gap-2 mb-8">
            {(icon.tags ?? []).map(tag => (
              <span key={tag} className="nb-badge bg-secondary text-sm px-3 py-1">
                <Hash className="w-3 h-3 inline mr-1" />{tag}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8 font-mono text-sm border-[3px] border-foreground p-6 bg-card shadow-[4px_4px_0_#0A0A0A]">
            <div className="flex flex-col gap-1">
              <span className="opacity-50 font-bold flex items-center gap-1"><Layers className="w-4 h-4" /> KATEGORI</span>
              <span className="font-bold text-lg">{icon.category}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="opacity-50 font-bold flex items-center gap-1"><Tag className="w-4 h-4" /> GAYA</span>
              <span className="font-bold text-lg uppercase">{icon.style}</span>
            </div>
            <div className="flex flex-col gap-1 mt-4">
              <span className="opacity-50 font-bold flex items-center gap-1"><Download className="w-4 h-4" /> UNDUHAN</span>
              <span className="font-bold text-lg">{icon.downloads}</span>
            </div>
            <div className="flex flex-col gap-1 mt-4">
              <span className="opacity-50 font-bold flex items-center gap-1"><ExternalLink className="w-4 h-4" /> LISENSI</span>
              <span className="font-bold text-lg uppercase">{icon.license}</span>
            </div>
          </div>

          {/* Quota warning */}
          {quotaExhausted && (
            <div className="border-[3px] border-foreground p-4 mb-4 flex items-center justify-between gap-3" style={{ background: "#FF6B35", color: "white" }}>
              <p className="font-mono text-xs font-bold">Kuota {quotaLimit} unduhan/hari habis. Reset tengah malam.</p>
              <Link href="/plus" className="nb-btn text-xs font-black px-3 py-1.5 whitespace-nowrap" style={{ background: "white", color: "#0A0A0A" }}>
                <Sparkles className="w-3 h-3 inline mr-1" /> UPGRADE
              </Link>
            </div>
          )}
          {quotaLow && !quotaExhausted && (
            <div className="border-[3px] border-foreground p-3 mb-4" style={{ background: "#FFE034" }}>
              <p className="font-mono text-xs font-bold">
                Sisa kuota: {quotaLimit - downloadsToday} unduhan hari ini.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleDownload}
              disabled={downloading || !!quotaExhausted}
              className="nb-btn bg-primary text-xl py-4 flex-1 flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-6 h-6" />
              {downloading ? "MENGUNDUH..." : quotaExhausted ? "KUOTA HABIS" : "UNDUH SVG"}
            </button>
            <button
              onClick={handleCopy}
              className="nb-btn bg-card text-xl py-4 flex-1 flex justify-center items-center gap-3"
            >
              <Code2 className="w-6 h-6" /> SALIN KODE
            </button>
          </div>
        </div>
      </div>

      {/* Similar Icons */}
      {Array.isArray(similarIcons) && similarIcons.length > 0 && (
        <section>
          <div className="border-t-[4px] border-foreground pt-12 mb-8">
            <h2 className="text-4xl font-black">IKON SERUPA</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {similarIcons.map((similar, i) => (
              <IconCard key={similar.id} icon={similar} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
