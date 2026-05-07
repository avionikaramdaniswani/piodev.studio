import { useState, useRef } from "react";
import { useCreateIcon } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileCode, X, CheckCircle2, XCircle, Loader2, Files, Package, User as UserIcon } from "lucide-react";
import { normalizeSvg } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

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

function computeSlug(baseSlug: string, index: number) {
  return index === 0 ? baseSlug : `${baseSlug}-${index + 1}`;
}

function filenameToName(filename: string): string {
  return filename
    .replace(/\.svg$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function UploadIconForm({ onSuccess }: UploadIconFormProps) {
  const { toast } = useToast();
  const createIcon = useCreateIcon();
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"single" | "pack">("single");
  const [svgFiles, setSvgFiles] = useState<SvgFile[]>([]);

  // Shared metadata
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("UI");
  const [tags, setTags] = useState("");
  const [style, setStyle] = useState<"outline" | "filled" | "duotone">("outline");
  const [license, setLicense] = useState("MIT");
  const [isUploading, setIsUploading] = useState(false);

  // Pack-specific state
  const [packName, setPackName] = useState("");
  const [packSlug, setPackSlug] = useState("");
  const [packDescription, setPackDescription] = useState("");
  const [iconNames, setIconNames] = useState<Record<string, string>>({});

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(toSlug(val));
  };

  const handlePackNameChange = (val: string) => {
    setPackName(val);
    setPackSlug(toSlug(val));
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
      if (mode === "pack") {
        setIconNames((prev) => {
          const next = { ...prev };
          newFiles.forEach((f) => {
            next[f.id] = filenameToName(f.fileName);
          });
          return next;
        });
      }
    });

    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setSvgFiles((prev) => prev.filter((f) => f.id !== id));
    setIconNames((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateFile = (id: string, patch: Partial<SvgFile>) => {
    setSvgFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const switchMode = (m: "single" | "pack") => {
    setMode(m);
    setSvgFiles([]);
    setIconNames({});
  };

  // ── SINGLE MODE SUBMIT ──────────────────────────────────────────────────
  const handleSingleSubmit = async (e: React.FormEvent) => {
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

    let startIndex = 0;
    try {
      const res = await fetch(`/api/icons/slug-start?base=${encodeURIComponent(baseSlugValue)}`);
      if (res.ok) {
        const data = await res.json() as { startIndex: number };
        startIndex = data.startIndex;
      }
    } catch {
      // continue from 0
    }

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

  // ── PACK MODE SUBMIT ────────────────────────────────────────────────────
  const handlePackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (svgFiles.length === 0) {
      toast({ title: "Belum ada file", description: "Pilih minimal satu file SVG.", variant: "destructive" });
      return;
    }
    if (!packName.trim()) {
      toast({ title: "Nama pack wajib diisi", variant: "destructive" });
      return;
    }

    const unnamedFile = svgFiles.find((f) => !(iconNames[f.id] ?? "").trim());
    if (unnamedFile) {
      toast({ title: "Semua ikon harus punya nama", description: `"${unnamedFile.fileName}" belum diberi nama.`, variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
    const finalPackSlug = packSlug || toSlug(packName);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/packs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          packName: packName.trim(),
          packSlug: finalPackSlug,
          packDescription: packDescription.trim() || undefined,
          category,
          style,
          license,
          tags: parsedTags,
          icons: svgFiles.map((f) => ({
            name: iconNames[f.id] ?? filenameToName(f.fileName),
            svgContent: f.svgContent,
          })),
        }),
      });

      const data = await res.json() as { pack?: { slug: string }; uploaded?: number; failed?: number; error?: string };

      if (!res.ok) {
        toast({ title: "Pack upload gagal", description: data.error ?? "Terjadi kesalahan.", variant: "destructive" });
      } else {
        toast({
          title: `Pack berhasil diupload!`,
          description: `${data.uploaded} ikon berhasil${data.failed ? `, ${data.failed} gagal` : ""}.`,
        });
        setSvgFiles([]);
        setIconNames({});
        setPackName("");
        setPackSlug("");
        setPackDescription("");
        onSuccess?.(data.pack?.slug ?? "");
      }
    } catch {
      toast({ title: "Terjadi kesalahan", description: "Coba lagi.", variant: "destructive" });
    }

    setIsUploading(false);
  };

  const pendingFiles = svgFiles.filter((f) => f.status !== "success");
  const pendingCount = pendingFiles.length;
  const baseSlug = slug || toSlug(name);

  return (
    <div className="flex flex-col gap-4">
      {/* Mode toggle */}
      <div className="flex border-[3px] border-foreground overflow-hidden shadow-[3px_3px_0_#0A0A0A] self-start">
        <button
          type="button"
          onClick={() => switchMode("single")}
          className={`flex items-center gap-2 px-5 py-2.5 font-black text-sm transition-all ${mode === "single" ? "" : "opacity-50 hover:opacity-80"}`}
          style={{ background: mode === "single" ? "#4DBBFF" : "transparent" }}
        >
          <UserIcon className="w-4 h-4" /> MODE SATUAN
        </button>
        <button
          type="button"
          onClick={() => switchMode("pack")}
          className={`flex items-center gap-2 px-5 py-2.5 font-black text-sm border-l-[3px] border-foreground transition-all ${mode === "pack" ? "" : "opacity-50 hover:opacity-80"}`}
          style={{ background: mode === "pack" ? "#FF6B9D" : "transparent" }}
        >
          <Package className="w-4 h-4" /> MODE PACK
        </button>
      </div>

      {mode === "single" ? (
        <form onSubmit={handleSingleSubmit}>
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
                <input ref={fileRef} type="file" accept=".svg,image/svg+xml" multiple onChange={handleFiles} className="hidden" />
              </div>

              {svgFiles.length > 0 && (
                <div className="nb-card p-4">
                  <div className="font-black text-xs mb-3 opacity-60">{svgFiles.length} FILE DIPILIH</div>
                  <div className="grid grid-cols-3 gap-3">
                    {svgFiles.map((f) => {
                      const isPending = f.status !== "success";
                      const pendingIndex = pendingFiles.findIndex((p) => p.id === f.id);
                      const displaySlug = f.status === "success" ? "—" : isPending && baseSlug ? computeSlug(baseSlug, pendingIndex) : "";

                      return (
                        <div key={f.id} className="flex flex-col items-center gap-1 p-3 rounded border-2 border-foreground/10 relative" style={{ background: "#F5F0E8" }}>
                          <div className="absolute top-1.5 right-1.5">
                            {f.status === "uploading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            {f.status === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                            {f.status === "error" && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                            {f.status === "pending" && (
                              <button type="button" onClick={() => removeFile(f.id)} className="opacity-30 hover:opacity-100">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div style={{ width: 48, height: 48, color: "#0A0A0A", overflow: "hidden", flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: normalizeSvg(f.svgContent) }} />
                          <div className="font-mono text-[9px] opacity-40 text-center leading-tight truncate w-full">{f.fileName.replace(/\.svg$/i, "")}</div>
                          {displaySlug && <div className="font-mono text-[9px] font-bold text-center truncate w-full">{displaySlug}</div>}
                          {f.status === "error" && <div className="text-[9px] text-red-500 text-center leading-tight">{f.errorMsg}</div>}
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
                <input type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} className="nb-input w-full" placeholder="Time" required />
              </div>
              <div>
                <label className="block font-black text-sm mb-2">
                  SLUG
                  {svgFiles.length > 1 && baseSlug && (
                    <span className="font-mono text-[10px] font-normal opacity-50 ml-2">→ {baseSlug}, {baseSlug}-2, {baseSlug}-3…</span>
                  )}
                </label>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="nb-input w-full" style={{ fontFamily: "'JetBrains Mono', monospace" }} placeholder={toSlug(name) || "time"} />
              </div>
              <div>
                <label className="block font-black text-sm mb-2">DESKRIPSI</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="nb-input w-full" placeholder="Deskripsi singkat ikon" />
              </div>
              <div>
                <label className="block font-black text-sm mb-2">KATEGORI</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="nb-input w-full">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-black text-sm mb-2">TAGS (pisah koma)</label>
                <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="nb-input w-full" placeholder="arrow, right, navigation" />
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
              <button type="submit" disabled={isUploading || svgFiles.length === 0} className="nb-btn w-full mt-2 text-lg font-black disabled:opacity-50" style={{ background: "#FFE034", color: "#0A0A0A" }}>
                {isUploading ? `MENGUPLOAD... (${svgFiles.filter((f) => f.status === "success").length + 1}/${svgFiles.length})` : pendingCount > 1 ? `UPLOAD ${pendingCount} IKON` : "UPLOAD IKON"}
              </button>
              {!isUploading && svgFiles.some((f) => f.status === "success" || f.status === "error") && (
                <div className="flex gap-3 text-xs font-mono">
                  {svgFiles.filter((f) => f.status === "success").length > 0 && (
                    <span className="flex items-center gap-1 text-green-600 font-bold"><CheckCircle2 className="w-3.5 h-3.5" />{svgFiles.filter((f) => f.status === "success").length} berhasil</span>
                  )}
                  {svgFiles.filter((f) => f.status === "error").length > 0 && (
                    <span className="flex items-center gap-1 text-red-500 font-bold"><XCircle className="w-3.5 h-3.5" />{svgFiles.filter((f) => f.status === "error").length} gagal</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </form>
      ) : (
        /* ── PACK MODE ─────────────────────────────────────────────── */
        <form onSubmit={handlePackSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT: File grid with per-icon name editing */}
            <div className="flex flex-col gap-4">
              <div className="nb-card p-5" style={{ borderColor: "#FF6B9D" }}>
                <label className="block font-black text-sm mb-3 flex items-center gap-2">
                  <Files className="w-4 h-4" /> FILE SVG PACK *
                  <span className="font-mono text-xs font-normal opacity-50">(tiap file = 1 ikon)</span>
                </label>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="nb-btn w-full flex items-center justify-center gap-2"
                  style={{ background: "#F5F0E8" }}
                >
                  <Upload className="w-4 h-4" /> PILIH FILE SVG
                </button>
                <input ref={fileRef} type="file" accept=".svg,image/svg+xml" multiple onChange={handleFiles} className="hidden" />
              </div>

              {svgFiles.length > 0 && (
                <div className="nb-card p-4">
                  <div className="font-black text-xs mb-3 opacity-60 flex items-center justify-between">
                    <span>{svgFiles.length} IKON DALAM PACK</span>
                    <span className="font-mono font-normal">edit nama tiap ikon ↓</span>
                  </div>
                  <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
                    {svgFiles.map((f) => (
                      <div key={f.id} className="flex items-center gap-3 p-2.5 border-[2px] border-foreground/10 rounded" style={{ background: "#F5F0E8" }}>
                        <div style={{ width: 36, height: 36, color: "#0A0A0A", overflow: "hidden", flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: normalizeSvg(f.svgContent) }} />
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <input
                            type="text"
                            value={iconNames[f.id] ?? ""}
                            onChange={(e) => setIconNames((prev) => ({ ...prev, [f.id]: e.target.value }))}
                            placeholder={filenameToName(f.fileName)}
                            className="nb-input px-2 py-1 text-xs font-bold w-full"
                            disabled={isUploading}
                          />
                          {packSlug && (
                            <span className="font-mono text-[9px] opacity-40 truncate">
                              {(packSlug || toSlug(packName))}-{toSlug(iconNames[f.id] || filenameToName(f.fileName)) || "icon"}
                            </span>
                          )}
                        </div>
                        {!isUploading && (
                          <button type="button" onClick={() => removeFile(f.id)} className="opacity-30 hover:opacity-100 shrink-0">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Pack + shared metadata */}
            <div className="flex flex-col gap-4">
              <div className="nb-card p-5 flex flex-col gap-4" style={{ borderColor: "#FF6B9D" }}>
                <div className="font-black text-xs border-b-2 border-foreground/20 pb-2 flex items-center gap-2">
                  <Package className="w-3.5 h-3.5" /> INFORMASI PACK
                </div>
                <div>
                  <label className="block font-black text-sm mb-2">NAMA PACK *</label>
                  <input type="text" value={packName} onChange={(e) => handlePackNameChange(e.target.value)} className="nb-input w-full" placeholder="Weather Icons" required />
                </div>
                <div>
                  <label className="block font-black text-sm mb-2">SLUG PACK</label>
                  <input
                    type="text"
                    value={packSlug}
                    onChange={(e) => setPackSlug(e.target.value)}
                    className="nb-input w-full"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    placeholder={toSlug(packName) || "weather-icons"}
                  />
                  <p className="font-mono text-[10px] opacity-40 mt-1">Slug ikon = {packSlug || toSlug(packName) || "pack-slug"}-{"{nama-ikon}"}</p>
                </div>
                <div>
                  <label className="block font-black text-sm mb-2">DESKRIPSI PACK</label>
                  <textarea
                    value={packDescription}
                    onChange={(e) => setPackDescription(e.target.value)}
                    className="nb-input w-full resize-none"
                    placeholder="Koleksi ikon cuaca untuk proyek UI..."
                    rows={2}
                    maxLength={500}
                  />
                </div>
              </div>

              <div className="nb-card p-5 flex flex-col gap-4">
                <div className="font-black text-xs opacity-50 border-b-2 border-foreground/20 pb-2">
                  METADATA BERSAMA — berlaku untuk semua ikon dalam pack
                </div>
                <div>
                  <label className="block font-black text-sm mb-2">KATEGORI</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="nb-input w-full">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-black text-sm mb-2">TAGS (pisah koma)</label>
                  <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="nb-input w-full" placeholder="weather, climate, nature" />
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
                  disabled={isUploading || svgFiles.length === 0 || !packName.trim()}
                  className="nb-btn w-full text-lg font-black disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "#FF6B9D", color: "white" }}
                >
                  <Package className="w-5 h-5" />
                  {isUploading ? "MENGUPLOAD PACK..." : `UPLOAD PACK (${svgFiles.length} IKON)`}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
