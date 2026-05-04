import { useState } from "react";
import { Link } from "wouter";
import { Grid, Search, Download, Heart, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListIcons } from "@workspace/api-client-react";
import type { Icon } from "@workspace/api-client-react";

const ACCENT_COLORS = ["#FFE034", "#FF6B9D", "#4DBBFF", "#00E676", "#FF6B35"];

function AdminIcons() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const { data, isLoading } = useListIcons({
    search: debouncedSearch || undefined,
    page,
    limit: LIMIT,
  });

  const icons: Icon[] = data?.icons ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
    clearTimeout((window as Window & { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer);
    (window as Window & { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(() => setDebouncedSearch(val), 300);
  };

  return (
    <AdminLayout title="KELOLA IKON">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b-[4px] border-foreground pb-4">
          <Grid className="w-7 h-7" />
          <div>
            <h1 className="font-black text-2xl">KELOLA IKON</h1>
            <p className="font-mono text-xs opacity-50">{total > 0 ? `${total} ikon tersedia` : "Kelola semua ikon"}</p>
          </div>
        </div>

        <div className="nb-card p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 border-b-[3px] border-foreground pb-4">
            <h2 className="font-black text-lg">SEMUA IKON</h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                <input
                  type="text"
                  placeholder="Cari nama ikon..."
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                  className="w-full border-[3px] border-foreground pl-9 pr-3 py-1.5 font-mono text-sm focus:outline-none"
                />
              </div>
              <Link href="/upload">
                <button className="nb-btn bg-primary text-sm px-3 py-1.5 whitespace-nowrap font-black">
                  + UPLOAD
                </button>
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="border-[3px] border-foreground h-36 animate-pulse bg-muted" />
              ))}
            </div>
          ) : icons.length === 0 ? (
            <p className="font-mono text-sm opacity-50 py-8 text-center">
              {debouncedSearch ? "Tidak ada ikon yang cocok." : "Belum ada ikon."}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {icons.map((icon, i) => (
                <div
                  key={icon.id}
                  className="border-[3px] border-foreground flex flex-col overflow-hidden hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0A0A0A] transition-all"
                >
                  <div className="h-1.5" style={{ background: ACCENT_COLORS[i % ACCENT_COLORS.length] }} />
                  <div className="flex-1 flex items-center justify-center p-4 bg-card min-h-[72px]">
                    <div
                      className="w-10 h-10 [&>svg]:w-full [&>svg]:h-full"
                      dangerouslySetInnerHTML={{ __html: icon.svgContent }}
                    />
                  </div>
                  <div className="p-2 bg-secondary border-t-[2px] border-foreground">
                    <p className="font-black text-xs truncate mb-1" title={icon.name}>{icon.name}</p>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[9px] opacity-50 border border-foreground px-1">{icon.category}</span>
                      <div className="flex items-center gap-2 font-mono text-[10px] opacity-50">
                        <span className="flex items-center gap-0.5"><Download className="w-2.5 h-2.5" />{icon.downloads}</span>
                        <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" />{icon.likes}</span>
                      </div>
                    </div>
                    <Link href={`/icons/${icon.slug}`}>
                      <button className="w-full border-[2px] border-foreground py-1 font-black text-[10px] flex items-center justify-center gap-1 hover:bg-foreground hover:text-background transition-colors">
                        <ExternalLink className="w-2.5 h-2.5" /> LIHAT
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && total > LIMIT && (
            <div className="flex items-center justify-between mt-6 border-t-[3px] border-foreground pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="nb-btn px-3 py-1.5 text-sm font-black flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> PREV
              </button>
              <span className="font-mono text-sm font-black">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages}
                className="nb-btn px-3 py-1.5 text-sm font-black flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                NEXT <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default function AdminIconsPage() {
  return (
    <RoleGuard requiredRole="staff">
      <AdminIcons />
    </RoleGuard>
  );
}
