import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { Download, Heart, Hash, Layers, Tag, ExternalLink, Code2, Sparkles, UserPlus, X, FileImage, FileText, FileCode2, ChevronDown } from "lucide-react";
import { jsPDF } from "jspdf";

import { useGetIconBySlug, useDownloadIcon, useToggleLike, useGetSimilarIcons, getGetSimilarIconsQueryKey } from "@workspace/api-client-react";

import { useToast } from "@/hooks/use-toast";
import { IconCard } from "@/components/shared/IconCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { normalizeSvg } from "@/lib/utils";

const ACCENT_COLORS = ['#FFE034', '#FF6B9D', '#4DBBFF', '#00E676', '#FF6B35'];

/** Apply a chosen color to an SVG string, replacing ALL hardcoded fill/stroke values. */
function applyColorToSvg(svgContent: string, color: string): string {
  return svgContent
    .replace(/currentColor/gi, color)
    .replace(/\bfill="(?!none\b)([^"]*)"/gi, `fill="${color}"`)
    .replace(/\bstroke="(?!none\b)([^"]*)"/gi, `stroke="${color}"`)
    .replace(/\bfill:\s*(?!none\b)[^;"}]*/gi, `fill:${color}`)
    .replace(/\bstroke:\s*(?!none\b)[^;"}]*/gi, `stroke:${color}`)
    .replace(/<svg([^>]*)>/, (_match, attrs) => {
      // If the original root SVG had fill="none" (stroke-based/outline icon),
      // preserve it so child paths don't accidentally inherit a fill color.
      // Only inject fill color for fill-based icons (no fill="none" on root).
      const rootHadFillNone = /\bfill="none"/i.test(attrs);
      const cleaned = attrs
        .replace(/\s*style="[^"]*"/i, "")
        .replace(/\s*\bfill="[^"]*"/i, "");
      const rootFill = rootHadFillNone ? "none" : color;
      return `<svg${cleaned} fill="${rootFill}" style="color:${color}">`;
    });
}

const PNG_SIZES = [16, 24, 32, 48, 64, 128, 256, 512];

/** Render a colored SVG string to a PNG blob at the given pixel size. */
function svgToPngBlob(svgString: string, size: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error("Canvas toBlob failed"));
      }, "image/png");
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("SVG load failed")); };
    img.src = url;
  });
}

/** Download an SVG as a PDF page sized to fit the icon. */
async function downloadAsPdf(svgString: string, filename: string) {
  const pngBlob = await svgToPngBlob(svgString, 512);
  const dataUrl = await new Promise<string>((res) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.readAsDataURL(pngBlob);
  });
  const pdf = new jsPDF({ unit: "px", format: [512, 512] });
  pdf.addImage(dataUrl, "PNG", 0, 0, 512, 512);
  pdf.save(`${filename}.pdf`);
}

export default function IconDetail() {
  const [, params] = useRoute("/icons/:slug");
  const slug = params?.slug || "";

  const { data: icon, isLoading, error } = useGetIconBySlug(slug);
  const { data: similarIcons } = useGetSimilarIcons(icon?.id || 0, { query: { enabled: !!icon?.id, queryKey: getGetSimilarIconsQueryKey(icon?.id || 0) } });

  const { toast } = useToast();
  const downloadMutation = useDownloadIcon();
  const likeMutation = useToggleLike();

  const [, navigate] = useLocation();
  const { user, tier, downloadsToday, quotaLimit, refreshProfile } = useAuth();

  const [likes, setLikes] = useState(0);
  const [iconColor, setIconColor] = useState("#0A0A0A");
  const [downloading, setDownloading] = useState(false);
  const [showAnonLimitModal, setShowAnonLimitModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedPngSize, setSelectedPngSize] = useState(64);
  const [showPngExpanded, setShowPngExpanded] = useState(false);

  useEffect(() => {
    if (showDownloadModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showDownloadModal]);

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

  const handleDownload = async (format: "svg" | "png" | "pdf", pngSize?: number) => {
    if (!icon || downloading) return;
    setDownloading(true);
    setShowDownloadModal(false);

    try {
      // Check quota via API (applies for all formats — 1 download = 1 quota unit)
      const { data: { session: s } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (s?.access_token) headers["Authorization"] = `Bearer ${s.access_token}`;

      const res = await fetch(`/api/icons/${icon.id}/download`, { method: "POST", headers });

      if (res.status === 429) {
        const data = await res.json() as { quota: number; used: number; reason?: string };
        setDownloading(false);
        if (data.reason === "anon_quota_exceeded") {
          setShowAnonLimitModal(true);
        } else {
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

      if (user) await refreshProfile();

      const coloredSvg = applyColorToSvg(icon.svgContent, iconColor);
      const slug = icon.slug;

      if (format === "svg") {
        const blob = new Blob([coloredSvg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${slug}.svg`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
      } else if (format === "png") {
        const size = pngSize ?? selectedPngSize;
        const pngBlob = await svgToPngBlob(coloredSvg, size);
        const url = URL.createObjectURL(pngBlob);
        const a = document.createElement("a");
        a.href = url; a.download = `${slug}-${size}.png`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
      } else if (format === "pdf") {
        await downloadAsPdf(coloredSvg, slug);
      }

      // Show success toast with quota info
      const isPlus = tier === "plus";
      const formatLabel = format.toUpperCase();
      if (!user) {
        const downloadData = await res.json().catch(() => null) as { used?: number } | null;
        const used = downloadData?.used ?? 1;
        const anonRemaining = 5 - used;
        toast({
          title: `DIUNDUH ${formatLabel}!`,
          description: anonRemaining > 0
            ? `Sisa ${anonRemaining} unduhan gratis hari ini — daftar untuk dapat 50/hari!`
            : `Kuota tamu habis. Daftar gratis untuk lanjut!`,
          className: "border-[3px] border-foreground rounded-none bg-primary text-primary-foreground font-bold shadow-[4px_4px_0_#0A0A0A]",
        });
      } else {
        const remaining = isPlus ? "∞" : String(quotaLimit - downloadsToday - 1);
        toast({
          title: `DIUNDUH ${formatLabel}!`,
          description: isPlus ? `${icon.name} berhasil diunduh.` : `Sisa kuota hari ini: ${remaining}`,
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

  const [copying, setCopying] = useState(false);

  const handleCopy = async () => {
    if (!icon || copying) return;
    setCopying(true);

    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (s?.access_token) headers["Authorization"] = `Bearer ${s.access_token}`;

      const res = await fetch(`/api/icons/${icon.id}/download`, { method: "POST", headers });

      if (res.status === 429) {
        const data = await res.json() as { quota: number; used: number; reason?: string };
        setCopying(false);
        if (data.reason === "anon_quota_exceeded") {
          setShowAnonLimitModal(true);
        } else {
          toast({
            title: "KUOTA HABIS!",
            description: `Kamu sudah mencapai batas ${data.quota} akses hari ini. Reset tengah malam atau upgrade ke Plus.`,
            className: "border-[3px] border-foreground rounded-none font-bold shadow-[4px_4px_0_#0A0A0A]",
            style: { background: "#FF6B35", color: "white" },
          });
        }
        return;
      }

      if (!res.ok) {
        setCopying(false);
        toast({
          title: "GAGAL",
          description: "Terjadi kesalahan. Coba lagi.",
          className: "border-[3px] border-foreground rounded-none bg-white font-bold shadow-[4px_4px_0_#0A0A0A]",
        });
        return;
      }

      if (user) await refreshProfile();

      await navigator.clipboard.writeText(icon.svgContent);

      const isPlus = tier === "plus";
      if (!user) {
        const dlData = await res.json().catch(() => null) as { used?: number } | null;
        const anonRemaining = 5 - (dlData?.used ?? 1);
        toast({
          title: "DISALIN!",
          description: anonRemaining > 0
            ? `Kode SVG disalin. Sisa ${anonRemaining} akses gratis hari ini.`
            : `Kode SVG disalin. Kuota tamu habis, daftar gratis untuk lanjut!`,
          className: "border-[3px] border-foreground rounded-none bg-[#4DBBFF] text-primary-foreground font-bold shadow-[4px_4px_0_#0A0A0A]",
        });
      } else {
        const remaining = isPlus ? "∞" : String(quotaLimit - downloadsToday - 1);
        toast({
          title: "DISALIN!",
          description: isPlus
            ? "Kode SVG berhasil disalin ke clipboard."
            : `Kode SVG disalin. Sisa kuota hari ini: ${remaining}`,
          className: "border-[3px] border-foreground rounded-none bg-[#4DBBFF] text-primary-foreground font-bold shadow-[4px_4px_0_#0A0A0A]",
        });
      }
    } catch {
      toast({
        title: "GAGAL",
        description: "Tidak bisa terhubung ke server. Coba lagi.",
        className: "border-[3px] border-foreground rounded-none bg-white font-bold shadow-[4px_4px_0_#0A0A0A]",
      });
    }

    setCopying(false);
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
                className="w-full h-full overflow-hidden"
                dangerouslySetInnerHTML={{ __html: applyColorToSvg(normalizeSvg(icon.svgContent), iconColor) }}
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
              onClick={() => setShowDownloadModal(true)}
              disabled={downloading || !!quotaExhausted}
              className="nb-btn bg-primary text-xl py-4 flex-1 flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-6 h-6" />
              {downloading ? "MENGUNDUH..." : quotaExhausted ? "KUOTA HABIS" : "UNDUH"}
            </button>
            <button
              onClick={handleCopy}
              disabled={copying}
              className="nb-btn bg-card text-xl py-4 flex-1 flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Code2 className="w-6 h-6" /> {copying ? "MENYALIN..." : "SALIN KODE"}
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

      {/* Download Format Modal */}
      {showDownloadModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          style={{ background: "rgba(10,10,10,0.65)" }}
          onClick={() => setShowDownloadModal(false)}
        >
          <div
            className="border-t-[4px] sm:border-[4px] border-foreground bg-background w-full sm:max-w-sm shadow-[0_-4px_0_#0A0A0A] sm:shadow-[6px_6px_0_#0A0A0A] max-h-[82vh] overflow-y-auto [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b-[3px] border-foreground px-4 py-3 sticky top-0 z-10" style={{ background: accentColor }}>
              <h2 className="text-lg font-black tracking-tight">PILIH FORMAT UNDUHAN</h2>
              <button onClick={() => setShowDownloadModal(false)} className="border-[2px] border-foreground bg-white p-1 hover:bg-gray-100 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {/* SVG Option */}
              <button
                onClick={() => handleDownload("svg")}
                className="nb-btn bg-card flex items-center gap-3 text-left py-3 px-4"
              >
                <div className="border-[2px] border-foreground p-1.5 flex-shrink-0" style={{ background: "#FFE034" }}>
                  <FileCode2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-base font-black">SVG</p>
                  <p className="font-mono text-xs text-muted-foreground leading-tight">Scalable Vector — tajam di semua ukuran</p>
                </div>
              </button>

              {/* PNG Option */}
              <div className="border-[3px] border-foreground" style={{ background: "#F8F8F8" }}>
                <div className="flex items-center gap-3 p-3">
                  <div className="border-[2px] border-foreground p-1.5 flex-shrink-0" style={{ background: "#4DBBFF" }}>
                    <FileImage className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-black">PNG</p>
                    <p className="font-mono text-xs text-muted-foreground leading-tight">
                      {showPngExpanded ? "Pilih ukuran di bawah" : `Default ${selectedPngSize}px`}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPngExpanded(!showPngExpanded)}
                    className="border-[2px] border-foreground bg-white p-1 hover:bg-gray-100 flex-shrink-0"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showPngExpanded ? "rotate-180" : ""}`} />
                  </button>
                </div>
                {showPngExpanded && (
                  <div className="border-t-[2px] border-foreground p-3 pt-2">
                    <div className="grid grid-cols-4 gap-1.5 mb-3">
                      {PNG_SIZES.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedPngSize(size)}
                          className={`border-[2px] border-foreground py-1.5 font-black font-mono text-xs transition-colors ${
                            selectedPngSize === size
                              ? "bg-foreground text-background"
                              : "bg-white hover:bg-gray-100"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="border-t-[2px] border-foreground">
                  <button
                    onClick={() => handleDownload("png", selectedPngSize)}
                    className="nb-btn bg-primary w-full flex justify-center items-center gap-2 py-2.5 text-sm border-0"
                  >
                    <Download className="w-4 h-4" />
                    UNDUH PNG {selectedPngSize}×{selectedPngSize}
                  </button>
                </div>
              </div>

              {/* PDF Option */}
              <button
                onClick={() => handleDownload("pdf")}
                className="nb-btn bg-card flex items-center gap-3 text-left py-3 px-4"
              >
                <div className="border-[2px] border-foreground p-1.5 flex-shrink-0" style={{ background: "#FF6B9D" }}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-base font-black">PDF</p>
                  <p className="font-mono text-xs text-muted-foreground leading-tight">512×512px — siap print & presentasi</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
