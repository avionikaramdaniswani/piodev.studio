import { useState, useRef } from "react";
import { useCreateIcon } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Upload, Eye, FileCode, X, CheckCircle2, XCircle, Loader2, Files } from "lucide-react";

const CATEGORIES = ["UI", "Navigation", "Social", "Media", "Files", "Communication", "Weather", "Finance", "Security", "Misc"];
const STYLES = ["outline", "filled", "duotone"] as const;

interface SvgFile {
  id: string;
  fileName: string;
  name: string;
  slug: string;
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

function nameFromFile(fileName: string) {
  return fileName.replace(/\.svg$/i, "").replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function UploadIconForm({ onSuccess }: UploadIconFormProps) {
  const { toast } = useToast();
  const createIcon = useCreateIcon();
  const fileRef = useRef<HTMLInputElement>(null);

  const [svgFiles, setSvgFiles] = useState<SvgFile[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("UI");
  const [tags, setTags] = useState("");
  const [style, setStyle] = useState<"outline" | "filled" | "duotone">("outline");
  const [license, setLicense] = useState("MIT");

  const [isUploading, setIsUploading] = useState(false);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const readers = files.map(
      (file) =>
        new Promise<SvgFile>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const name = nameFromFile(file.name);
            resolve({
              id: `${file.name}-${Date.now()}-${Math.random()}`,
              fileName: file.name,
              name,
              slug: toSlug(name),
              svgContent: ev.target?.result as string,
              status: "pending",
            });
          };
          reader.readAsText(file);
        })
    );

    Promise.all(readers).then((newFiles) => {
      setSvgFiles((prev) => [...prev, ...newFiles]);
      if (!previewId && newFiles.length > 0) setPreviewId(newFiles[0].id);
    });

    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setSvgFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (previewId === id) setPreviewId(next[0]?.id ?? null);
      return next;
    });
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

    setIsUploading(true);
    const parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
    let successCount = 0;
    let lastSlug = "";

    for (const file of svgFiles) {
      if (file.status === "success") continue;

      updateFile(file.id, { status: "uploading" });
      try {
        const icon = await createIcon.mutateAsync({
          data: {
            name: file.name,
            slug: file.slug,
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

  const previewFile = svgFiles.find((f) => f.id === previewId);
  const pendingCount = svgFiles.filter((f) => f.status !== "success").length;

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: File list + preview */}
        <div className="flex flex-col gap-4">
          {/* Drop zone / upload button */}
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

          {/* File list */}
          {svgFiles.length > 0 && (
            <div className="nb-card p-4 flex flex-col gap-2">
              <div className="font-black text-xs mb-1 opacity-60">{svgFiles.length} FILE DIPILIH</div>
              <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                {svgFiles.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => setPreviewId(f.id)}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer border-2 transition-colors ${
                      previewId === f.id ? "border-foreground bg-[#FFE034]" : "border-transparent hover:border-foreground/30"
                    }`}
                  >
                    {/* Status icon */}
                    <div className="flex-shrink-0 w-5">
                      {f.status === "uploading" && <Loader2 className="w-4 h-4 animate-spin" />}
                      {f.status === "success" && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                      {f.status === "error" && <XCircle className="w-4 h-4 text-red-500" />}
                      {f.status === "pending" && <FileCode className="w-4 h-4 opacity-40" />}
                    </div>

                    {/* Name + filename */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs truncate">{f.name}</div>
                      <div className="font-mono text-[10px] opacity-40 truncate">{f.fileName}</div>
                      {f.status === "error" && (
                        <div className="text-[10px] text-red-500 truncate">{f.errorMsg}</div>
                      )}
                    </div>

                    {/* Editable name */}
                    <input
                      type="text"
                      value={f.name}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateFile(f.id, { name: val, slug: toSlug(val) });
                      }}
                      className="nb-input text-xs py-1 px-2 w-28 flex-shrink-0"
                      placeholder="Nama ikon"
                      disabled={f.status === "uploading" || f.status === "success"}
                    />

                    {/* Remove */}
                    {f.status !== "uploading" && f.status !== "success" && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                        className="flex-shrink-0 opacity-40 hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SVG Preview */}
          {previewFile && (
            <div className="nb-card p-5 flex flex-col items-center justify-center gap-3" style={{ background: "#F5F0E8", minHeight: 140 }}>
              <div className="flex items-center gap-2 font-black text-xs opacity-50">
                <Eye className="w-3.5 h-3.5" /> PREVIEW — {previewFile.name}
              </div>
              <div
                style={{ width: 96, height: 96, color: "#0A0A0A" }}
                dangerouslySetInnerHTML={{ __html: previewFile.svgContent }}
              />
            </div>
          )}
        </div>

        {/* RIGHT: Shared metadata */}
        <div className="nb-card p-5 flex flex-col gap-4">
          <div className="font-black text-xs opacity-50 border-b-2 border-foreground/20 pb-2">
            METADATA — berlaku untuk semua {svgFiles.length > 1 ? `${svgFiles.length} ikon` : "ikon"}
          </div>

          <div>
            <label className="block font-black text-sm mb-2">DESKRIPSI</label>
            <input
              type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              className="nb-input w-full" placeholder="Deskripsi singkat ikon"
            />
          </div>
          <div>
            <label className="block font-black text-sm mb-2">KATEGORI</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="nb-input w-full">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-black text-sm mb-2">TAGS (pisah koma)</label>
            <input
              type="text" value={tags} onChange={(e) => setTags(e.target.value)}
              className="nb-input w-full" placeholder="arrow, right, navigation"
            />
          </div>
          <div>
            <label className="block font-black text-sm mb-2">STYLE</label>
            <select value={style} onChange={(e) => setStyle(e.target.value as typeof style)} className="nb-input w-full">
              {STYLES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-black text-sm mb-2">LISENSI</label>
            <select value={license} onChange={(e) => setLicense(e.target.value)} className="nb-input w-full">
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
          >
            {isUploading
              ? `MENGUPLOAD... (${svgFiles.filter((f) => f.status === "uploading").length > 0
                  ? svgFiles.findIndex((f) => f.status === "uploading") + 1
                  : svgFiles.filter((f) => f.status === "success").length}/${svgFiles.length})`
              : svgFiles.length > 1
              ? `UPLOAD ${pendingCount} IKON`
              : "UPLOAD IKON"}
          </button>

          {/* Summary after upload */}
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
