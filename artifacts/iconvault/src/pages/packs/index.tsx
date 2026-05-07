import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Package, Grid3x3, ArrowLeft } from "lucide-react";
import { normalizeSvg } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  UI: "#FFE034", Social: "#FF6B9D", Navigation: "#4DBBFF", Media: "#00E676",
  Files: "#FF6B35", Communication: "#FFE034", Weather: "#4DBBFF", Finance: "#00E676",
  Security: "#FF6B9D", Misc: "#FF6B35",
};

interface PackPreviewIcon { id: number; slug: string; svgContent: string }
interface Pack {
  id: number; name: string; slug: string; description: string | null;
  category: string; style: string; iconCount: number; createdAt: string;
  previewIcons: PackPreviewIcon[];
}

function PackCard({ pack }: { pack: Pack }) {
  const catColor = CATEGORY_COLORS[pack.category] ?? "#FFE034";
  return (
    <Link href={`/packs/${pack.slug}`} className="group block">
      <div className="border-[3px] border-foreground shadow-[3px_3px_0_#0A0A0A] transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:shadow-[5px_5px_0_#0A0A0A] flex flex-col overflow-hidden" style={{ background: "#FFFBF0" }}>
        {/* Folder tab */}
        <div className="flex">
          <div className="px-2 py-[3px] border-b-[3px] border-r-[2px] border-foreground text-[8px] font-black tracking-wider" style={{ background: catColor }}>
            PACK
          </div>
          <div className="flex-1 border-b-[3px] border-foreground" style={{ background: catColor, opacity: 0.25 }} />
        </div>
        {/* 2×2 preview */}
        <div className="grid grid-cols-2 border-b-[2px] border-foreground/30 relative" style={{ background: "#EDE8DC" }}>
          {[0, 1, 2, 3].map((i) => {
            const icon = pack.previewIcons[i];
            return (
              <div key={i} className={`aspect-square flex items-center justify-center p-2 ${i === 1 || i === 3 ? "border-l-[1px] border-foreground/30" : ""} ${i >= 2 ? "border-t-[1px] border-foreground/30" : ""}`}>
                {icon ? (
                  <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full opacity-75" dangerouslySetInnerHTML={{ __html: normalizeSvg(icon.svgContent) }} />
                ) : (
                  <div className="w-4 h-4 border-[2px] border-foreground/15 rounded-full" />
                )}
              </div>
            );
          })}
          <div className="absolute bottom-1 right-1 flex items-center gap-0.5 font-mono text-[9px] font-bold px-1 py-px border-[2px] border-foreground" style={{ background: catColor }}>
            <Grid3x3 className="w-2 h-2" />
            {pack.iconCount}
          </div>
        </div>
        {/* Name */}
        <div className="px-2.5 py-2 flex items-center gap-1.5 min-w-0">
          <Package className="w-3 h-3 shrink-0 opacity-40" />
          <p className="font-black text-[11px] leading-tight line-clamp-1 flex-1">{pack.name}</p>
        </div>
      </div>
    </Link>
  );
}

export default function PacksPage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/packs")
      .then((r) => r.json() as Promise<Pack[]>)
      .then((data) => setPacks(Array.isArray(data) ? data : []))
      .catch(() => setPacks([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/icons" className="flex items-center gap-1.5 font-mono text-xs opacity-50 hover:opacity-100 transition-opacity">
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali
        </Link>
        <div className="flex-1" />
      </div>

      <div className="border-b-[4px] border-foreground pb-4 flex items-end gap-4">
        <div>
          <h1 className="font-black text-4xl leading-none mb-1">ICON PACKS</h1>
          <p className="font-mono text-sm opacity-50">Koleksi ikon terpaket — satu pack, banyak ikon.</p>
        </div>
        {!loading && (
          <span className="font-mono text-xs opacity-40 pb-1 ml-auto">{packs.length} pack</span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="border-[3px] border-foreground aspect-[3/4] bg-muted animate-pulse" />
          ))}
        </div>
      ) : packs.length === 0 ? (
        <div className="nb-card p-16 text-center" style={{ background: "#FFE034" }}>
          <Package className="w-14 h-14 mx-auto mb-4 opacity-40" />
          <h2 className="text-2xl font-black mb-2">BELUM ADA PACK</h2>
          <p className="font-mono text-sm opacity-60">Pack ikon akan muncul di sini setelah diupload.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4">
          {packs.map((pack) => (
            <PackCard key={pack.id} pack={pack} />
          ))}
        </div>
      )}
    </div>
  );
}
