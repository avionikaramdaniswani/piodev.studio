import { useState, useRef } from "react";
import { Link } from "wouter";
import {
  Grid, Search, Download, Heart, ExternalLink,
  ChevronLeft, ChevronRight, Pencil, Trash2, X,
  Check, Eye, Star, StarOff, Loader2, Upload,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useListIcons,
  useUpdateIcon,
  useDeleteIcon,
  getListIconsQueryKey,
} from "@workspace/api-client-react";
import type { Icon } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { normalizeSvg } from "@/lib/utils";

const CATEGORIES = ["UI", "Navigation", "Social", "Media", "Files", "Communication", "Weather", "Finance", "Security", "Misc"];
const STYLES = ["outline", "filled", "duotone"] as const;
const ACCENT_COLORS = ["#FFE034", "#FF6B9D", "#4DBBFF", "#00E676", "#FF6B35"];

interface EditForm {
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string;
  style: "outline" | "filled" | "duotone";
  license: string;
  isFeatured: boolean;
  svgContent: string;
}

function EditModal({ icon, onClose, onSaved }: { icon: Icon; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const updateIcon = useUpdateIcon();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<EditForm>({
    name: icon.name,
    slug: icon.slug,
    description: icon.description ?? "",
    category: icon.category,
    tags: (icon.tags ?? []).join(", "),
    style: icon.style as "outline" | "filled" | "duotone",
    license: icon.license,
    isFeatured: icon.isFeatured,
    svgContent: icon.svgContent,
  });

  const set = (key: keyof EditForm, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set("svgContent", ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleNameChange = (val: string) => {
    setForm(prev => ({
      ...prev,
      name: val,
      slug: val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateIcon.mutate(
      {
        id: icon.id,
        data: {
          name: form.name,
          slug: form.slug,
          description: form.description || null,
          category: form.category,
          tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
          style: form.style,
          license: form.license,
          isFeatured: form.isFeatured,
          svgContent: form.svgContent,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Ikon diperbarui!", description: `"${form.name}" berhasil disimpan.` });
          onSaved();
          onClose();
        },
        onError: () => {
          toast({ title: "Gagal memperbarui", description: "Coba lagi.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl border-[4px] border-foreground bg-background shadow-[8px_8px_0_#0A0A0A] flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b-[4px] border-foreground p-4 flex items-center justify-between bg-foreground text-background flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 border-[2px] border-background flex items-center justify-center overflow-hidden p-0.5"
              style={{ background: "#FFE034" }}
              dangerouslySetInnerHTML={{ __html: normalizeSvg(icon.svgContent) }}
            />
            <span className="font-black text-sm">EDIT IKON — {icon.name}</span>
          </div>
          <button onClick={onClose} className="border-[2px] border-background p-1 hover:bg-background hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left column */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="block font-black text-xs mb-1.5">NAMA *</label>
                <input
                  type="text" value={form.name} required
                  onChange={e => handleNameChange(e.target.value)}
                  className="nb-input w-full text-sm"
                />
              </div>
              <div>
                <label className="block font-black text-xs mb-1.5">SLUG</label>
                <input
                  type="text" value={form.slug}
                  onChange={e => set("slug", e.target.value)}
                  className="nb-input w-full text-sm font-mono"
                />
              </div>
              <div>
                <label className="block font-black text-xs mb-1.5">DESKRIPSI</label>
                <input
                  type="text" value={form.description}
                  onChange={e => set("description", e.target.value)}
                  className="nb-input w-full text-sm"
                  placeholder="Opsional"
                />
              </div>
              <div>
                <label className="block font-black text-xs mb-1.5">KATEGORI</label>
                <select value={form.category} onChange={e => set("category", e.target.value)} className="nb-input w-full text-sm">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-black text-xs mb-1.5">TAGS (pisah koma)</label>
                <input
                  type="text" value={form.tags}
                  onChange={e => set("tags", e.target.value)}
                  className="nb-input w-full text-sm"
                  placeholder="arrow, right, navigation"
                />
              </div>
              <div>
                <label className="block font-black text-xs mb-1.5">STYLE</label>
                <select value={form.style} onChange={e => set("style", e.target.value as typeof form.style)} className="nb-input w-full text-sm">
                  {STYLES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-black text-xs mb-1.5">LISENSI</label>
                <select value={form.license} onChange={e => set("license", e.target.value)} className="nb-input w-full text-sm">
                  <option value="MIT">MIT</option>
                  <option value="Apache-2.0">Apache 2.0</option>
                  <option value="CC0">CC0 (Public Domain)</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    onClick={() => set("isFeatured", !form.isFeatured)}
                    className={`w-10 h-6 border-[3px] border-foreground flex items-center transition-colors ${form.isFeatured ? "" : ""}`}
                    style={{ background: form.isFeatured ? "#FFE034" : "#e5e5e5" }}
                  >
                    <div
                      className={`w-4 h-4 border-[2px] border-foreground transition-transform ${form.isFeatured ? "translate-x-4" : "translate-x-0"}`}
                      style={{ background: "white" }}
                    />
                  </div>
                  <span className="font-black text-xs flex items-center gap-1">
                    {form.isFeatured ? <Star className="w-3.5 h-3.5" /> : <StarOff className="w-3.5 h-3.5" />}
                    TAMPILKAN DI FEATURED
                  </span>
                </label>
              </div>
            </div>

            {/* Right column — SVG */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="block font-black text-xs mb-1.5">SVG CONTENT</label>
                <textarea
                  value={form.svgContent}
                  onChange={e => set("svgContent", e.target.value)}
                  className="nb-input w-full text-xs"
                  rows={8}
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="mt-2 w-full border-[2px] border-foreground py-1.5 font-black text-xs flex items-center justify-center gap-2 hover:bg-secondary transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" /> GANTI FILE SVG
                </button>
                <input ref={fileRef} type="file" accept=".svg,image/svg+xml" onChange={handleFile} className="hidden" />
              </div>
              {form.svgContent && (
                <div className="border-[2px] border-foreground p-4 flex flex-col items-center gap-2" style={{ background: "#F5F0E8" }}>
                  <span className="font-black text-[10px] opacity-50 flex items-center gap-1"><Eye className="w-3 h-3" /> PREVIEW</span>
                  <div
                    className="w-16 h-16 overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: normalizeSvg(form.svgContent) }}
                  />
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t-[4px] border-foreground p-4 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="border-[3px] border-foreground px-4 py-2 font-black text-sm hover:bg-secondary transition-colors"
          >
            BATAL
          </button>
          <button
            onClick={handleSubmit}
            disabled={updateIcon.isPending}
            className="nb-btn px-5 py-2 font-black text-sm flex items-center gap-2 disabled:opacity-60"
            style={{ background: "#00E676" }}
          >
            {updateIcon.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {updateIcon.isPending ? "MENYIMPAN..." : "SIMPAN"}
          </button>
        </div>
      </div>
    </div>
  );
}

function IconCard({
  icon,
  accentColor,
  onEdit,
  onDeleted,
}: {
  icon: Icon;
  accentColor: string;
  onEdit: (icon: Icon) => void;
  onDeleted: () => void;
}) {
  const { toast } = useToast();
  const deleteIcon = useDeleteIcon();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    deleteIcon.mutate(
      { id: icon.id },
      {
        onSuccess: () => {
          toast({ title: "Ikon dihapus", description: `"${icon.name}" berhasil dihapus.` });
          onDeleted();
        },
        onError: () => {
          toast({ title: "Gagal menghapus", description: "Coba lagi.", variant: "destructive" });
          setConfirmDelete(false);
        },
      }
    );
  };

  return (
    <div className="border-[3px] border-foreground flex flex-col overflow-hidden hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#0A0A0A] transition-all">
      <div className="h-1.5 flex-shrink-0" style={{ background: accentColor }} />

      {/* Preview */}
      <div className="flex-1 flex items-center justify-center p-[18%] bg-card min-h-[72px] relative">
        <div
          className="w-full h-full overflow-hidden"
          dangerouslySetInnerHTML={{ __html: normalizeSvg(icon.svgContent) }}
        />
        {icon.isFeatured && (
          <Star className="w-3 h-3 absolute top-1.5 right-1.5 opacity-40" />
        )}
      </div>

      {/* Info */}
      <div className="p-2 bg-secondary border-t-[2px] border-foreground flex flex-col gap-1.5">
        <p className="font-black text-xs truncate" title={icon.name}>{icon.name}</p>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] opacity-50 border border-foreground px-1">{icon.category}</span>
          <div className="flex items-center gap-2 font-mono text-[10px] opacity-50">
            <span className="flex items-center gap-0.5"><Download className="w-2.5 h-2.5" />{icon.downloads}</span>
            <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" />{icon.likes}</span>
          </div>
        </div>

        {/* Actions */}
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <span className="font-black text-[10px] flex-1 text-red-600">Yakin hapus?</span>
            <button
              onClick={handleDelete}
              disabled={deleteIcon.isPending}
              className="border-[2px] border-red-600 bg-red-600 text-white px-1.5 py-0.5 font-black text-[10px] flex items-center gap-0.5 hover:opacity-80 disabled:opacity-50"
            >
              {deleteIcon.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              YA
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="border-[2px] border-foreground px-1.5 py-0.5 font-black text-[10px] hover:bg-foreground hover:text-background transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            <Link href={`/icons/${icon.slug}`} target="_blank">
              <button className="w-full border-[2px] border-foreground py-1 font-black text-[10px] flex items-center justify-center gap-0.5 hover:bg-foreground hover:text-background transition-colors">
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </Link>
            <button
              onClick={() => onEdit(icon)}
              className="border-[2px] border-foreground py-1 font-black text-[10px] flex items-center justify-center gap-0.5 hover:bg-foreground hover:text-background transition-colors"
            >
              <Pencil className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="border-[2px] border-red-500 py-1 font-black text-[10px] flex items-center justify-center gap-0.5 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminIcons() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingIcon, setEditingIcon] = useState<Icon | null>(null);
  const queryClient = useQueryClient();
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
    (window as Window & { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(
      () => setDebouncedSearch(val), 300
    );
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListIconsQueryKey() });
    queryClient.invalidateQueries({ queryKey: ["getIconStats"] });
  };

  return (
    <AdminLayout title="KELOLA IKON">
      {editingIcon && (
        <EditModal
          icon={editingIcon}
          onClose={() => setEditingIcon(null)}
          onSaved={invalidate}
        />
      )}

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
              <Link href="/admin/upload">
                <button className="nb-btn text-sm px-3 py-1.5 whitespace-nowrap font-black" style={{ background: "#00E676" }}>
                  + UPLOAD
                </button>
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="border-[3px] border-foreground h-44 animate-pulse bg-muted" />
              ))}
            </div>
          ) : icons.length === 0 ? (
            <p className="font-mono text-sm opacity-50 py-8 text-center">
              {debouncedSearch ? "Tidak ada ikon yang cocok." : "Belum ada ikon."}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {icons.map((icon, i) => (
                <IconCard
                  key={icon.id}
                  icon={icon}
                  accentColor={ACCENT_COLORS[i % ACCENT_COLORS.length]}
                  onEdit={setEditingIcon}
                  onDeleted={invalidate}
                />
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
              <span className="font-mono text-sm font-black">{page} / {totalPages}</span>
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
