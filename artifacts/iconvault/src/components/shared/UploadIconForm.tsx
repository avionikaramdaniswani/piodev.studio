import { useState, useRef } from "react";
import { useCreateIcon } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileCode, X, CheckCircle2, XCircle, Loader2, Files } from "lucide-react";

const CATEGORIES = ["UI", "Navigation", "Social", "Media", "Files", "Communication", "Weather", "Finance", "Security", "Misc"];
const STYLES = ["outline", "filled", "duotone"] as const;

interface SvgFile {
  id: string;
  fileName: string;
  svgContent: string;
  status: "pending" | "uploading" | "success" | "error";
  errorMsg?: string;
}

interface UploadIconFormProps {
  onSuccess?: (slug: string) => void;
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function normalizeSvgForPreview(svg: string): string {
  return svg.replace(/<svg([^>]*)>/i, (_match, attrs: string) => {
    const getAttr = (name: string) => {
      const m = attrs.match(new RegExp(`\\b${name}\\s*=\\s*["']?([\\d.]+)`, "i"));
      return m ? m[1] : null;
    };

    const hasViewBox = /\bviewBox\s*=/i.test(attrs);
    const w = getAttr("width");
    const h = getAttr("height");

    let cleaned = attrs
      .replace(/\bwidth\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/\bheight\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

    // If no viewBox but original dimensions exist, synthesize one so SVG scales correctly
    if (!hasViewBox && w && h) {
      cleaned += ` viewBox="0 0 ${w} ${h}"`;
    }

    return `<svg${cleaned} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">`;
  });
}

function computeSlug(baseSlug: string, index: number) {
  return index === 0 ? baseSlug : `${baseSlug}-${index + 1}`;
}

export function UploadIconForm({ onSuccess }: UploadIconFormProps) {
  const { toast } = useToast();
  const createIcon = useCreateIcon();
  const fileRef = useRef<HTMLInputElement>(null);

  const [svgFiles, setSvgFiles] = useState<SvgFile[]>([]);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("UI");
  const [tags, setTags] = useState("");
  const [style, setStyle] = useState<"outline" | "filled" | "duotone">("outline");
  const [license, setLicense] = useState("MIT");

  const [isUploading, setIsUploading] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(toSlug(val));
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const readers = files.map(
      (file) =>
        new Promise<SvgFile>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            resolve({
              id: `${file.name}-${Date.now()}-${Math.random()}`,
              fileName: file.name,
              svgContent: ev.target?.result as string,
              status: "pending",
            });
          };
          reader.readAsText(file);
        })
    );

    Promise.all(readers).then((newFiles) => {
      setSvgFiles((prev) => [...prev, ...newFiles]);
    });

    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setSvgFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFile = (id: string, patch: Partial<SvgFile>) => {
    setSvgFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (svgFiles.length === 0) {
      toast({ title: "Belum ada file", description: "Pilih minimal satu file SVG.", variant: "destructive" });
      return;
    }
    if (!name.trim()) {
      toast({ title: "Nama wajib diisi", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
    const baseSlugValue = slug || toSlug(name);
    let successCount = 0;
    let lastSlug = "";

    // Check DB for existing slugs with this base to avoid conflicts
    let startIndex = 0;
    try {
      const res = await fetch(`/api/icons/slug-start?base=${encodeURIComponent(baseSlugValue)}`);
      if (res.ok) {
        const data = await res.json() as { startIndex: number };
        startIndex = data.startIndex;
      }
    } catch {
      // If check fails, continue from 0 (best-effort)
    }

    // Only upload pending files; track their index for slug numbering
    const pendingFiles = svgFiles.filter((f) => f.status !== "success");

    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i];
      const fileSlug = computeSlug(baseSlugValue, startIndex + i);

      updateFile(file.id, { status: "uploading" });
      try {
        const icon = await createIcon.mutateAsync({
          data: {
            name,
            slug: fileSlug,
            description: description || undefined,
            svgContent: file.svgContent,
            category,
            tags: parsedTags,
            style,
            license,
          },
        });
        updateFile(file.id, { status: "success" });
        successCount++;
        lastSlug = icon.slug;
      } catch (err: unknown) {
        const msg = (err as { message?: string })?.message ?? "Upload gagal";
        updateFile(file.id, { status: "error", errorMsg: msg });
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      toast({
        title: `${successCount} ikon berhasil diupload!`,
        description: successCount < svgFiles.length ? "Beberapa file gagal, cek list di bawah." : "Semua ikon sudah live.",
      });
      onSuccess?.(lastSlug);
    } else {
      toast({ title: "Semua upload gagal", description: "Periksa file dan coba lagi.", variant: "destructive" });
    }
  };

  const pendingFiles = svgFiles.filter((f) => f.status !== "success");
  const pendingCount = pendingFiles.length;
  const baseSlug = slug || toSlug(name);

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: File previews */}
        <div className="flex flex-col gap-4">
          <div className="nb-card p-5">
            <label className="block font-black text-sm mb-3 flex items-center gap-2">
              <Files className="w-4 h-4" /> FILE SVG *
              <span className="font-mono text-xs font-normal opacity-50">(bisa pilih banyak)</span>
            </label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="nb-btn w-full flex items-center justify-center gap-2"
              style={{ background: "#F5F0E8" }}
            >
              <Upload className="w-4 h-4" /> PILIH FILE SVG
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".svg,image/svg+xml"
              multiple
              onChange={handleFiles}
              className="hidden"
            />
          </div>

          {svgFiles.length > 0 && (
            <div className="nb-card p-4">
              <div className="font-black text-xs mb-3 opacity-60">{svgFiles.length} FILE DIPILIH</div>
              <div className="grid grid-cols-3 gap-3">
                {svgFiles.map((f, i) => {
                  const isPending = f.status !== "success";
                  const pendingIndex = pendingFiles.findIndex((p) => p.id === f.id);
                  const displaySlug = f.status === "success"
                    ? "—"
                    : isPending && baseSlug
                    ? computeSlug(baseSlug, pendingIndex)
                    : "";

                  return (
                    <div
                      key={f.id}
                      className="flex flex-col items-center gap-1 p-3 rounded border-2 border-foreground/10 relative"
                      style={{ background: "#F5F0E8" }}
                    >
                      {/* Status badge */}
                      <div className="absolute top-1.5 right-1.5">
                        {f.status === "uploading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {f.status === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                        {f.status === "error" && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                        {f.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => removeFile(f.id)}
                            className="opacity-30 hover:opacity-100"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* SVG preview */}
                      <div
                        style={{ width: 48, height: 48, color: "#0A0A0A", overflow: "hidden", flexShrink: 0 }}
                        dangerouslySetInnerHTML={{ __html: normalizeSvgForPreview(f.svgContent) }}
                      />

                      {/* Filename */}
                      <div className="font-mono text-[9px] opacity-40 text-center leading-tight truncate w-full text-center">
                        {f.fileName.replace(/\.svg$/i, "")}
                      </div>

                      {/* Slug preview */}
                      {displaySlug && (
                        <div className="font-mono text-[9px] font-bold text-center truncate w-full" style={{ color: "#0A0A0A" }}>
                          {displaySlug}
                        </div>
                      )}

                      {/* Error message */}
                      {f.status === "error" && (
                        <div className="text-[9px] text-red-500 text-center leading-tight">{f.errorMsg}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Shared metadata */}
        <div className="nb-card p-5 flex flex-col gap-4">
          <div className="font-black text-xs opacity-50 border-b-2 border-foreground/20 pb-2">
            METADATA — berlaku untuk semua {svgFiles.length > 1 ? `${svgFiles.length} ikon` : "ikon"}
          </div>

          <div>
            <label className="block font-black text-sm mb-2">NAMA *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="nb-input w-full"
              placeholder="Time"
              required
              data-testid="input-icon-name"
            />
          </div>

          <div>
            <label className="block font-black text-sm mb-2">
              SLUG
              {svgFiles.length > 1 && baseSlug && (
                <span className="font-mono text-[10px] font-normal opacity-50 ml-2">
                  → {baseSlug}, {baseSlug}-2, {baseSlug}-3…
                </span>
              )}
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="nb-input w-full"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
              placeholder={toSlug(name) || "time"}
              data-testid="input-icon-slug"
            />
          </div>

          <div>
            <label className="block font-black text-sm mb-2">DESKRIPSI</label>
            <input
              type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              className="nb-input w-full" placeholder="Deskripsi singkat ikon"
              data-testid="input-icon-description"
            />
          </div>
          <div>
            <label className="block font-black text-sm mb-2">KATEGORI</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="nb-input w-full" data-testid="select-category">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-black text-sm mb-2">TAGS (pisah koma)</label>
            <input
              type="text" value={tags} onChange={(e) => setTags(e.target.value)}
              className="nb-input w-full" placeholder="arrow, right, navigation"
              data-testid="input-tags"
            />
          </div>
          <div>
            <label className="block font-black text-sm mb-2">STYLE</label>
            <select value={style} onChange={(e) => setStyle(e.target.value as typeof style)} className="nb-input w-full" data-testid="select-style">
              {STYLES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-black text-sm mb-2">LISENSI</label>
            <select value={license} onChange={(e) => setLicense(e.target.value)} className="nb-input w-full" data-testid="select-license">
              <option value="MIT">MIT</option>
              <option value="Apache-2.0">Apache 2.0</option>
              <option value="CC0">CC0 (Public Domain)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isUploading || svgFiles.length === 0}
            className="nb-btn w-full mt-2 text-lg font-black"
            style={{ background: "#FFE034", color: "#0A0A0A" }}
            data-testid="button-submit-upload"
          >
            {isUploading
              ? `MENGUPLOAD... (${
                  svgFiles.filter((f) => f.status === "success").length + 1
                }/${svgFiles.length})`
              : pendingCount > 1
              ? `UPLOAD ${pendingCount} IKON`
              : "UPLOAD IKON"}
          </button>

          {!isUploading && svgFiles.some((f) => f.status === "success" || f.status === "error") && (
            <div className="flex gap-3 text-xs font-mono">
              {svgFiles.filter((f) => f.status === "success").length > 0 && (
                <span className="flex items-center gap-1 text-green-600 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {svgFiles.filter((f) => f.status === "success").length} berhasil
                </span>
              )}
              {svgFiles.filter((f) => f.status === "error").length > 0 && (
                <span className="flex items-center gap-1 text-red-500 font-bold">
                  <XCircle className="w-3.5 h-3.5" />
                  {svgFiles.filter((f) => f.status === "error").length} gagal
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
