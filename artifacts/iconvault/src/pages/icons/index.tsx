import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Search, Filter, Sparkles, X, Package, Grid3x3, Tag, Layers } from "lucide-react";
import { useListIcons, useListCategories, ListIconsStyle } from "@workspace/api-client-react";
import { IconCard } from "@/components/shared/IconCard";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeSvg } from "@/lib/utils";

const STYLES = ["outline", "filled", "duotone"] as const;
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

interface PackPreviewIcon { id: number; slug: string; svgContent: string }
interface Pack {
  id: number; name: string; slug: string; description: string | null;
  category: string; style: string; iconCount: number; createdAt: string;
  previewIcons: PackPreviewIcon[];
}

function PackCard({ pack }: { pack: Pack }) {
  const catColor = CATEGORY_COLORS[pack.category] ?? "#FFE034";
  const styleColor = STYLE_COLORS[pack.style] ?? "#4DBBFF";

  return (
    <Link href={`/packs/${pack.slug}`} className="group block">
      <div className="nb-card overflow-hidden transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-[6px_6px_0_#0A0A0A]">
        <div className="h-2 w-full" style={{ background: catColor }} />

        {/* Preview grid 2×2 */}
        <div className="grid grid-cols-2 border-b-[3px] border-foreground" style={{ background: "#F5F0E8" }}>
          {[0, 1, 2, 3].map((i) => {
            const icon = pack.previewIcons[i];
            return (
              <div
                key={i}
                className={`aspect-square flex items-center justify-center p-4 ${i === 1 || i === 3 ? "border-l-[2px] border-foreground" : ""} ${i >= 2 ? "border-t-[2px] border-foreground" : ""}`}
              >
                {icon ? (
                  <div
                    className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: normalizeSvg(icon.svgContent) }}
                  />
                ) : (
                  <div className="w-8 h-8 border-[2px] border-foreground/20 rounded-full" />
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 flex flex-col gap-2">
          <p className="font-black text-base leading-tight line-clamp-1">{pack.name}</p>
          {pack.description && (
            <p className="font-mono text-[11px] opacity-50 leading-tight line-clamp-2">{pack.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span
              className="font-black text-[10px] px-2 py-0.5 border-[2px] border-foreground"
              style={{ background: catColor }}
            >{pack.category}</span>
            <span
              className="font-black text-[10px] px-2 py-0.5 border-[2px] border-foreground"
              style={{ background: styleColor }}
            >{pack.style.toUpperCase()}</span>
            <span className="font-mono text-[10px] px-2 py-0.5 border-[2px] border-foreground bg-card ml-auto flex items-center gap-1">
              <Grid3x3 className="w-3 h-3" /> {pack.iconCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function PacksView() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/packs")
      .then((r) => r.json() as Promise<Pack[]>)
      .then((data) => setPacks(Array.isArray(data) ? data : []))
      .catch(() => setPacks([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="nb-card aspect-[3/4] animate-pulse bg-muted" />
        ))}
      </div>
    );
  }

  if (packs.length === 0) {
    return (
      <div className="nb-card p-16 text-center" style={{ background: "#FFE034" }}>
        <Package className="w-14 h-14 mx-auto mb-4 opacity-40" />
        <h2 className="text-2xl font-black mb-2">BELUM ADA PACK</h2>
        <p className="font-mono text-sm opacity-60">Pack ikon akan muncul di sini setelah diupload oleh admin.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {packs.map((pack) => (
        <PackCard key={pack.id} pack={pack} />
      ))}
    </div>
  );
}

export default function IconsList() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [category, setCategory] = useState<string>("");
  const [style, setStyle] = useState<ListIconsStyle | "">("");
  const [page, setPage] = useState(1);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [view, setView] = useState<"icons" | "packs">("icons");
  const { user, tier } = useAuth();
  const showBanner = !bannerDismissed && user && tier !== "plus";

  const { data: iconData, isLoading: loadingIcons } = useListIcons({
    search: debouncedSearch,
    category: category || undefined,
    style: (style as ListIconsStyle) || undefined,
    page,
    limit: 24,
  });

  const { data: categories, isLoading: loadingCategories } = useListCategories();
  const catList = Array.isArray(categories) ? categories : [];

  return (
    <div className="flex flex-col gap-6 py-4">

      {/* Plus banner */}
      {showBanner && view === "icons" && (
        <div className="flex items-center justify-between gap-4 border-[3px] border-foreground px-5 py-3 shadow-[3px_3px_0_#0A0A0A]" style={{ background: "#FFE034" }}>
          <div className="flex items-center gap-3 min-w-0">
            <Sparkles className="w-4 h-4 shrink-0" />
            <p className="font-black text-sm truncate">
              Kamu pakai paket Free — <span className="font-mono font-normal">upgrade ke Plus untuk unduhan tak terbatas &amp; koleksi eksklusif.</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/plus" className="nb-btn px-3 py-1.5 text-xs font-black whitespace-nowrap" style={{ background: "#0A0A0A", color: "white" }}>
              LIHAT PLUS →
            </Link>
            <button onClick={() => setBannerDismissed(true)} className="opacity-50 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* View toggle: ICONS | PACKS */}
      <div className="flex items-center gap-0 border-[3px] border-foreground overflow-hidden self-start shadow-[3px_3px_0_#0A0A0A]">
        <button
          onClick={() => setView("icons")}
          className={`flex items-center gap-2 px-5 py-2.5 font-black text-sm transition-all ${view === "icons" ? "" : "opacity-50 hover:opacity-80"}`}
          style={{ background: view === "icons" ? "#FFE034" : "transparent" }}
        >
          <Grid3x3 className="w-4 h-4" /> IKON
        </button>
        <button
          onClick={() => setView("packs")}
          className={`flex items-center gap-2 px-5 py-2.5 font-black text-sm border-l-[3px] border-foreground transition-all ${view === "packs" ? "" : "opacity-50 hover:opacity-80"}`}
          style={{ background: view === "packs" ? "#FF6B9D" : "transparent" }}
        >
          <Package className="w-4 h-4" /> PACKS
        </button>
      </div>

      {view === "packs" ? (
        <PacksView />
      ) : (
        <>
          {/* Search */}
          <div className="py-2 border-b-[4px] border-foreground">
            <div className="nb-input flex items-center gap-3 px-4 py-3">
              <Search className="w-5 h-5 text-foreground shrink-0" />
              <input
                type="text"
                placeholder="SEARCH ICONS..."
                className="flex-1 bg-transparent outline-none text-xl font-black"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
              {search && (
                <button onClick={() => { setSearch(""); setPage(1); }} className="shrink-0 opacity-50 hover:opacity-100 text-lg font-black leading-none">✕</button>
              )}
            </div>
          </div>

          {/* Mobile filter bar */}
          <div className="lg:hidden -mx-4 px-4 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
            <div className="flex items-center gap-2 pb-2" style={{ minWidth: "max-content" }}>
              <span className="text-xs font-black opacity-40 shrink-0 flex items-center gap-1"><Filter className="w-3 h-3" /> CAT</span>
              <button onClick={() => { setCategory(""); setPage(1); }} className="nb-badge text-xs shrink-0 whitespace-nowrap transition-colors" style={{ background: !category ? "#FFE034" : "white" }}>ALL</button>
              {loadingCategories
                ? [1,2,3].map(i => <div key={i} className="h-6 w-14 bg-muted border-[2px] border-foreground shrink-0" />)
                : catList.map(cat => (
                  <button key={cat.name} onClick={() => { setCategory(cat.name); setPage(1); }} className="nb-badge text-xs shrink-0 whitespace-nowrap transition-colors" style={{ background: category === cat.name ? "#FFE034" : "white" }}>
                    {cat.name.toUpperCase()}
                  </button>
                ))
              }
              <div className="w-px h-6 bg-foreground opacity-30 mx-1 shrink-0" />
              <button onClick={() => { setStyle(""); setPage(1); }} className="nb-badge text-xs shrink-0 whitespace-nowrap transition-colors" style={{ background: style === "" ? "#0A0A0A" : "white", color: style === "" ? "white" : "#0A0A0A" }}>ALL STYLES</button>
              {STYLES.map(s => (
                <button key={s} onClick={() => { setStyle(s); setPage(1); }} className="nb-badge text-xs shrink-0 whitespace-nowrap transition-colors" style={{ background: style === s ? STYLE_COLORS[s] : "white" }}>
                  {s.toUpperCase()}
                </button>
              ))}
              {(category || style) && (
                <>
                  <div className="w-px h-6 bg-foreground opacity-30 mx-1 shrink-0" />
                  <button onClick={() => { setCategory(""); setStyle(""); setPage(1); }} className="nb-badge text-xs shrink-0 whitespace-nowrap" style={{ background: "#FF6B35", color: "white" }}>✕ CLEAR</button>
                </>
              )}
            </div>
          </div>

          {/* Desktop layout: sidebar + grid */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-6">
              <div className="nb-card p-4">
                <h3 className="font-black text-base mb-3 border-b-[3px] border-foreground pb-2 flex items-center gap-2"><Filter className="w-4 h-4" /> CATEGORIES</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => { setCategory(""); setPage(1); }} className="nb-badge text-xs transition-colors" style={{ background: !category ? "#FFE034" : "white" }}>ALL</button>
                  {loadingCategories
                    ? [1,2,3].map(i => <div key={i} className="h-6 w-16 bg-muted border-[2px] border-foreground" />)
                    : catList.map(cat => (
                      <button key={cat.name} onClick={() => { setCategory(cat.name); setPage(1); }} className="nb-badge text-xs transition-colors" style={{ background: category === cat.name ? "#FFE034" : "white" }}>
                        {cat.name.toUpperCase()} ({cat.count})
                      </button>
                    ))
                  }
                </div>
              </div>
              <div className="nb-card p-4">
                <h3 className="font-black text-base mb-3 border-b-[3px] border-foreground pb-2">STYLES</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => { setStyle(""); setPage(1); }} className="nb-badge text-xs transition-colors" style={{ background: style === "" ? "#0A0A0A" : "white", color: style === "" ? "white" : "#0A0A0A" }}>ALL</button>
                  {STYLES.map(s => (
                    <button key={s} onClick={() => { setStyle(s); setPage(1); }} className="nb-badge text-xs transition-colors" style={{ background: style === s ? STYLE_COLORS[s] : "white" }}>
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              {(category || style) && (
                <button onClick={() => { setCategory(""); setStyle(""); setPage(1); }} className="nb-btn text-sm" style={{ background: "#FF6B35", color: "white" }}>✕ CLEAR FILTERS</button>
              )}
            </aside>

            <div className="flex-1 w-full min-w-0">
              {loadingIcons ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {[...Array(20)].map((_, i) => <div key={i} className="nb-card aspect-square bg-muted animate-pulse" />)}
                </div>
              ) : (Array.isArray(iconData?.icons) ? iconData!.icons.length : 0) === 0 ? (
                <div className="nb-card p-12 text-center" style={{ background: "#FFE034" }}>
                  <h2 className="text-2xl font-black mb-2">NO ICONS FOUND</h2>
                  <p className="font-mono text-sm">Try a different search or clear your filters.</p>
                  <button onClick={() => { setSearch(""); setCategory(""); setStyle(""); }} className="nb-btn mt-5" style={{ background: "white" }}>CLEAR FILTERS</button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 mb-10">
                    {(Array.isArray(iconData?.icons) ? iconData!.icons : []).map((icon, i) => (
                      <IconCard key={icon.id} icon={icon} index={i} />
                    ))}
                  </div>
                  {iconData && iconData.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-6">
                      <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="nb-btn bg-card disabled:opacity-40 disabled:cursor-not-allowed text-sm px-5">← PREV</button>
                      <span className="font-mono font-bold px-4 py-2 border-[3px] border-foreground" style={{ background: "#FFE034" }}>{page} / {iconData.totalPages}</span>
                      <button disabled={page === iconData.totalPages} onClick={() => setPage(p => p + 1)} className="nb-btn bg-card disabled:opacity-40 disabled:cursor-not-allowed text-sm px-5">NEXT →</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
