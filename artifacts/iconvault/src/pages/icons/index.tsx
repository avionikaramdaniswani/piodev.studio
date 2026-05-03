import { useState } from "react";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { useListIcons, useListCategories, ListIconsStyle } from "@workspace/api-client-react";
import { IconCard } from "@/components/shared/IconCard";
import { useDebounce } from "@/hooks/use-debounce";

export default function IconsList() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [category, setCategory] = useState<string>("");
  const [style, setStyle] = useState<ListIconsStyle | "">("");
  const [page, setPage] = useState(1);

  const { data: iconData, isLoading: loadingIcons } = useListIcons({
    search: debouncedSearch,
    category: category || undefined,
    style: (style as ListIconsStyle) || undefined,
    page,
    limit: 24,
  });

  const { data: categories, isLoading: loadingCategories } = useListCategories();

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* Sticky Search Bar */}
      <div className="sticky top-20 z-40 bg-background/95 backdrop-blur py-4 border-b-[4px] border-foreground">
        <div className="nb-input max-w-4xl mx-auto flex items-center gap-3 px-4 py-3">
          <Search className="w-6 h-6 text-foreground shrink-0" />
          <input
            type="text"
            placeholder="SEARCH ICONS..."
            className="flex-1 bg-transparent outline-none text-2xl font-black"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => { setSearch(""); setPage(1); }}
              className="shrink-0 text-foreground opacity-50 hover:opacity-100 text-xl font-black leading-none"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-8 sticky top-48">
          {/* Categories */}
          <div className="nb-card p-4">
            <h3 className="font-black text-xl mb-4 border-b-[3px] border-foreground pb-2 flex items-center gap-2">
              <Filter className="w-5 h-5" /> CATEGORIES
            </h3>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => { setCategory(""); setPage(1); }}
                className={`nb-badge text-sm ${!category ? 'bg-primary' : 'bg-card hover:bg-secondary'}`}
              >
                ALL
              </button>
              {loadingCategories ? (
                <div className="animate-pulse flex gap-2">
                  <div className="h-6 w-16 bg-muted border-[2px] border-foreground"></div>
                  <div className="h-6 w-20 bg-muted border-[2px] border-foreground"></div>
                </div>
              ) : (Array.isArray(categories) ? categories : []).map(cat => (
                <button 
                  key={cat.name}
                  onClick={() => { setCategory(cat.name); setPage(1); }}
                  className={`nb-badge text-sm ${category === cat.name ? 'bg-primary' : 'bg-card hover:bg-secondary'}`}
                >
                  {cat.name.toUpperCase()} ({cat.count})
                </button>
              ))}
            </div>
          </div>

          {/* Styles */}
          <div className="nb-card p-4">
            <h3 className="font-black text-xl mb-4 border-b-[3px] border-foreground pb-2 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5" /> STYLES
            </h3>
            <div className="flex flex-col gap-2 font-mono text-sm font-bold">
              <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-secondary border-[3px] border-transparent hover:border-foreground transition-colors">
                <input 
                  type="radio" 
                  name="style" 
                  value="" 
                  checked={style === ""}
                  onChange={() => { setStyle(""); setPage(1); }}
                  className="w-4 h-4 border-[2px] border-foreground rounded-none accent-primary appearance-none checked:bg-primary checked:shadow-[2px_2px_0_#0A0A0A]" 
                /> ALL STYLES
              </label>
              {(["outline", "filled", "duotone"] as const).map(s => (
                <label key={s} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-secondary border-[3px] border-transparent hover:border-foreground transition-colors">
                  <input 
                    type="radio" 
                    name="style" 
                    value={s} 
                    checked={style === s}
                    onChange={() => { setStyle(s); setPage(1); }}
                    className="w-4 h-4 border-[2px] border-foreground rounded-none accent-primary appearance-none checked:bg-primary checked:shadow-[2px_2px_0_#0A0A0A]" 
                  /> {s.toUpperCase()}
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Icon Grid */}
        <div className="flex-1 w-full">
          {loadingIcons ? (
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-6">
              {[...Array(24)].map((_, i) => (
                <div key={i} className="nb-card h-40 bg-muted animate-pulse" />
              ))}
            </div>
          ) : (Array.isArray(iconData?.icons) ? iconData!.icons.length : 0) === 0 ? (
            <div className="nb-card bg-accent p-12 text-center text-accent-foreground">
              <h2 className="text-3xl font-black mb-2 uppercase">NO ICONS FOUND</h2>
              <p className="font-mono">Try searching for something else or clear your filters.</p>
              <button 
                onClick={() => { setSearch(""); setCategory(""); setStyle(""); }}
                className="nb-btn bg-background text-foreground mt-6"
              >
                CLEAR FILTERS
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6 mb-12">
                {(Array.isArray(iconData?.icons) ? iconData!.icons : []).map((icon, i) => (
                  <IconCard key={icon.id} icon={icon} index={i} />
                ))}
              </div>
              
              {/* Pagination */}
              {iconData && iconData.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <button 
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="nb-btn bg-card disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    PREV
                  </button>
                  <span className="font-mono font-bold px-4 py-2 border-[3px] border-foreground bg-primary">
                    {page} / {iconData.totalPages}
                  </span>
                  <button 
                    disabled={page === iconData.totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="nb-btn bg-card disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    NEXT
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
