import { useState, useRef } from "react";
import { useCreateIcon } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Upload, Eye, FileCode } from "lucide-react";

const CATEGORIES = ["UI", "Navigation", "Social", "Media", "Files", "Communication", "Weather", "Finance", "Security", "Misc"];
const STYLES = ["outline", "filled", "duotone"] as const;

interface UploadIconFormProps {
  onSuccess?: (slug: string) => void;
}

export function UploadIconForm({ onSuccess }: UploadIconFormProps) {
  const { toast } = useToast();
  const createIcon = useCreateIcon();
  const fileRef = useRef<HTMLInputElement>(null);

  const [svgContent, setSvgContent] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("UI");
  const [tags, setTags] = useState("");
  const [style, setStyle] = useState<"outline" | "filled" | "duotone">("outline");
  const [license, setLicense] = useState("MIT");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setSvgContent(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
  };

  const resetForm = () => {
    setSvgContent("");
    setName("");
    setSlug("");
    setDescription("");
    setCategory("UI");
    setTags("");
    setStyle("outline");
    setLicense("MIT");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!svgContent.trim()) {
      toast({ title: "Error", description: "SVG content wajib diisi.", variant: "destructive" });
      return;
    }
    createIcon.mutate(
      {
        data: {
          name,
          slug,
          description: description || undefined,
          svgContent,
          category,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          style,
          license,
        },
      },
      {
        onSuccess: (icon) => {
          toast({ title: "Ikon berhasil diupload!", description: `"${icon.name}" sudah live.` });
          resetForm();
          onSuccess?.(icon.slug);
        },
        onError: () => {
          toast({ title: "Upload gagal", description: "Periksa input dan coba lagi.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div className="nb-card p-5">
            <label className="block font-black text-sm mb-3 flex items-center gap-2">
              <FileCode className="w-4 h-4" /> SVG CODE *
            </label>
            <textarea
              value={svgContent}
              onChange={(e) => setSvgContent(e.target.value)}
              className="nb-input w-full"
              rows={10}
              placeholder="<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'...>"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
              data-testid="textarea-svg-content"
              required
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="nb-btn mt-3 w-full flex items-center justify-center gap-2"
              style={{ background: "#F5F0E8" }}
              data-testid="button-upload-file"
            >
              <Upload className="w-4 h-4" /> UPLOAD FILE SVG
            </button>
            <input ref={fileRef} type="file" accept=".svg,image/svg+xml" onChange={handleFile} className="hidden" />
          </div>

          {svgContent && (
            <div className="nb-card p-5 flex flex-col items-center justify-center gap-3" style={{ background: "#F5F0E8", minHeight: 140 }}>
              <div className="flex items-center gap-2 font-black text-xs opacity-50">
                <Eye className="w-3.5 h-3.5" /> PREVIEW
              </div>
              <div
                style={{ width: 96, height: 96, color: "#0A0A0A" }}
                dangerouslySetInnerHTML={{ __html: svgContent }}
                data-testid="preview-svg"
              />
            </div>
          )}
        </div>

        <div className="nb-card p-5 flex flex-col gap-4">
          <div>
            <label className="block font-black text-sm mb-2">NAMA *</label>
            <input
              type="text" value={name} onChange={(e) => handleNameChange(e.target.value)}
              className="nb-input w-full" placeholder="Arrow Right" required
              data-testid="input-icon-name"
            />
          </div>
          <div>
            <label className="block font-black text-sm mb-2">SLUG</label>
            <input
              type="text" value={slug} onChange={(e) => setSlug(e.target.value)}
              className="nb-input w-full"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
              data-testid="input-icon-slug"
            />
          </div>
          <div>
            <label className="block font-black text-sm mb-2">DESKRIPSI</label>
            <input
              type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              className="nb-input w-full" placeholder="A right-pointing arrow"
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
            disabled={createIcon.isPending}
            className="nb-btn w-full mt-2 text-lg font-black"
            style={{ background: "#FFE034", color: "#0A0A0A" }}
            data-testid="button-submit-upload"
          >
            {createIcon.isPending ? "MENGUPLOAD..." : "UPLOAD IKON"}
          </button>
        </div>
      </div>
    </form>
  );
}
