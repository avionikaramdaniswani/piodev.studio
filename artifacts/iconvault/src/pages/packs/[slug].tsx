import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { Package, ArrowLeft, Grid3x3, Tag, Layers, Download, Loader2 } from "lucide-react";
import JSZip from "jszip";
import { IconCard } from "@/components/shared/IconCard";
import { useToast } from "@/hooks/use-toast";
import type { Icon } from "@workspace/api-client-react";

interface Pack {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  style: string;
  iconCount: number;
  createdAt: string;
}

const STYLE_COLORS: Record<string, string> = {
  outline: "#4DBBFF",
  filled: "#FF6B9D",
  duotone: "#00E676",
};

const CATEGORY_COLORS: Record<string, string> = {
  UI: "#FFE034", Social: "#FF6B9D", Navigation: "#4DBBFF", Media: "#00E676",
  Files: "#FF6B35", Communication: "#FFE034", Weather: "#4DBBFF", Finance: "#00E676",
  Security: "#FF6B9D", Misc: "#FF6B35",
};

export default function PackDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [pack, setPack] = useState<Pack | null>(null);
  const [icons, setIcons] = useState<Icon[]>([] as Icon[]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    fetch(`/api/packs/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Pack not found");
        return r.json() as Promise<{ pack: Pack; icons: unknown[] }>;
      })
      .then((data) => {
        setPack(data.pack);
        setIcons(data.icons as Icon[]);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleDownloadZip = async () => {
    if (!pack || icons.length === 0 || zipping) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(pack.slug) ?? zip;
      for (const icon of icons) {
        folder.file(`${icon.slug}.svg`, icon.svgContent);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pack.slug}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "PACK DIUNDUH!",
        description: `${icons.length} SVG dikemas dalam ${pack.slug}.zip`,
        className: "border-[3px] border-foreground rounded-none font-bold shadow-[4px_4px_0_#0A0A0A]",
        style: { background: "#00E676" },
      });
    } catch {
      toast({
        title: "GAGAL",
        description: "Tidak bisa membuat file ZIP. Coba lagi.",
        className: "border-[3px] border-foreground rounded-none font-bold shadow-[4px_4px_0_#0A0A0A]",
        style: { background: "#FF6B35", color: "white" },
      });
    }
    setZipping(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-6">
        <div className="h-40 nb-card animate-pulse" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-square border-[3px] border-foreground animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !pack) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="nb-card p-10 text-center max-w-sm" style={{ background: "#FF6B35", color: "white" }}>
          <Package className="w-12 h-12 mx-auto mb-4" />
          <p className="font-black text-xl">PACK TIDAK DITEMUKAN</p>
          <p className="font-mono text-sm opacity-80 mt-1">{error ?? "Pack ini tidak ada."}</p>
        </div>
        <Link href="/icons" className="nb-btn px-5 py-2 font-black flex items-center gap-2" style={{ background: "#FFE034" }}>
          <ArrowLeft className="w-4 h-4" /> KEMBALI KE IKON
        </Link>
      </div>
    );
  }

  const catColor = CATEGORY_COLORS[pack.category] ?? "#FFE034";
  const styleColor = STYLE_COLORS[pack.style] ?? "#4DBBFF";

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* Header */}
      <div>
        <Link href="/packs" className="inline-flex items-center gap-1.5 font-mono text-xs opacity-50 hover:opacity-100 mb-4 transition-opacity">
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Packs
        </Link>

        <div className="nb-card overflow-hidden">
          <div className="h-3 w-full" style={{ background: catColor }} />
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-start">
            {/* Pack icon */}
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 border-[4px] border-foreground shadow-[4px_4px_0_#0A0A0A] flex items-center justify-center shrink-0"
              style={{ background: catColor }}
            >
              <Package className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="font-black text-2xl sm:text-3xl leading-tight mb-1">{pack.name}</h1>
              {pack.description && (
                <p className="font-mono text-sm opacity-60 mb-3">{pack.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-xs px-2.5 py-1 border-[2px] border-foreground shadow-[2px_2px_0_#0A0A0A] flex items-center gap-1" style={{ background: catColor }}>
                  <Tag className="w-3 h-3" /> {pack.category}
                </span>
                <span className="font-black text-xs px-2.5 py-1 border-[2px] border-foreground shadow-[2px_2px_0_#0A0A0A] flex items-center gap-1" style={{ background: styleColor }}>
                  <Layers className="w-3 h-3" /> {pack.style.toUpperCase()}
                </span>
                <span className="font-black text-xs px-2.5 py-1 border-[2px] border-foreground shadow-[2px_2px_0_#0A0A0A] flex items-center gap-1 bg-card">
                  <Grid3x3 className="w-3 h-3" /> {pack.iconCount} IKON
                </span>
              </div>
            </div>

            {/* Download ZIP button */}
            {icons.length > 0 && (
              <button
                onClick={handleDownloadZip}
                disabled={zipping}
                className="nb-btn flex items-center gap-2 px-4 py-2.5 font-black text-sm shrink-0 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                style={{ background: "#0A0A0A", color: "white" }}
              >
                {zipping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {zipping ? "MENGEMAS..." : "UNDUH PACK (.ZIP)"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Icon grid */}
      {icons.length === 0 ? (
        <div className="nb-card p-12 text-center" style={{ background: "#FFE034" }}>
          <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-black text-xl">PACK KOSONG</p>
          <p className="font-mono text-sm opacity-50">Belum ada ikon dalam pack ini.</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-sm opacity-40 flex items-center gap-2">
              <Grid3x3 className="w-4 h-4" /> {icons.length} IKON DALAM PACK INI
            </h2>
            <button
              onClick={handleDownloadZip}
              disabled={zipping}
              className="flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 border-[2px] border-foreground shadow-[2px_2px_0_#0A0A0A] hover:shadow-[3px_3px_0_#0A0A0A] disabled:opacity-50 transition-all"
              style={{ background: "#FFE034" }}
            >
              {zipping ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              {zipping ? "Mengemas..." : "Unduh semua .zip"}
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
            {icons.map((icon, i) => (
              <IconCard key={icon.id} icon={icon} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
