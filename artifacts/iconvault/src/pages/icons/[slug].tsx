import { useState } from "react";
import { useRoute, Link } from "wouter";
import { Download, Copy, Heart, Hash, Layers, Tag, ExternalLink, Code2, Sparkles } from "lucide-react";

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

  const { user, tier, downloadsToday, quotaLimit, refreshProfile } = useAuth();

  const [likes, setLikes] = useState(0);
  const [iconColor, setIconColor] = useState("#0A0A0A");
  const [downloading, setDownloading] = useState(false);

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

    // Logged-in users: check quota via Supabase RPC
    if (user) {
      const { data: result, error: rpcError } = await supabase.rpc("check_and_record_download", {
        p_icon_id: icon.id,
      });

      if (rpcError) {
        setDownloading(false);
        toast({
          title: "GAGAL",
          description: "Terjadi kesalahan saat memeriksa kuota. Coba lagi.",
          className: "border-[3px] border-foreground rounded-none bg-white font-bold shadow-[4px_4px_0_#0A0A0A]",
        });
        return;
      }

      const res = result as { allowed: boolean; reason?: string; tier: string; quota: number; used: number };

      if (!res.allowed) {
        setDownloading(false);
        toast({
          title: "KUOTA HABIS!",
          description: `Kamu sudah mencapai batas ${res.quota} unduhan hari ini. Reset otomatis tengah malam, atau upgrade ke Plus untuk unduhan tak terbatas.`,
          className: "border-[3px] border-foreground rounded-none font-bold shadow-[4px_4px_0_#0A0A0A]",
          style: { background: "#FF6B35", color: "white" },
          action: undefined,
        });
        return;
      }

      // Refresh profile to update quota display
      await refreshProfile();
    }

    // Trigger the actual download
    const blob = new Blob([icon.svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${icon.slug}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Increment global download counter on icon
    downloadMutation.mutate({ id: icon.id });

    const isPlus = tier === "plus";
    const remaining = isPlus ? "∞" : String(quotaLimit - downloadsToday - 1);

    toast({
      title: "DIUNDUH!",
      description: isPlus
        ? `${icon.name} berhasil diunduh.`
        : `${icon.name} diunduh. Sisa kuota hari ini: ${remaining}`,
      className: "border-[3px] border-foreground rounded-none bg-primary text-primary-foreground font-bold shadow-[4px_4px_0_#0A0A0A]",
    });

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
