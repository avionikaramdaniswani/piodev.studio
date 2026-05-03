import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useCreateIcon } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["UI", "Navigation", "Social", "Media", "Files", "Communication", "Weather", "Finance", "Security", "Misc"];
const STYLES = ["outline", "filled", "duotone"] as const;

export default function UploadIcon() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createIcon = useCreateIcon();

  const [svgContent, setSvgContent] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("UI");
  const [tags, setTags] = useState("");
  const [style, setStyle] = useState<"outline" | "filled" | "duotone">("outline");
  const [license, setLicense] = useState("MIT");
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!svgContent.trim()) {
      toast({ title: "Error", description: "SVG content is required.", variant: "destructive" });
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
          toast({ title: "Icon uploaded!", description: `"${icon.name}" is now live.` });
          setLocation(`/icons/${icon.slug}`);
        },
        onError: () => {
          toast({ title: "Upload failed", description: "Check your input and try again.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen" style={{ background: "#FFFBF0" }}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10">
          <span className="nb-badge" style={{ background: "#00E676" }}>Contribute</span>
          <h1 className="text-5xl font-black mt-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#0A0A0A" }}>
            UPLOAD ICON
          </h1>
          <p className="text-lg mt-2" style={{ color: "#3D3D3D" }}>Share your SVG with the community. MIT license preferred.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SVG input */}
            <div className="space-y-4">
              <div className="nb-card p-5" style={{ background: "white" }}>
                <label className="block font-black text-sm mb-3">SVG CODE *</label>
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
                <button type="button" onClick={() => fileRef.current?.click()} className="nb-btn mt-3 w-full" style={{ background: "#F5F0E8" }} data-testid="button-upload-file">
                  UPLOAD SVG FILE
                </button>
                <input ref={fileRef} type="file" accept=".svg,image/svg+xml" onChange={handleFile} className="hidden" />
              </div>

              {/* Preview */}
              {svgContent && (
                <div className="nb-card p-5 flex items-center justify-center" style={{ background: "#F5F0E8", minHeight: 140 }}>
                  <div
                    style={{ width: 96, height: 96, color: "#0A0A0A" }}
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                    data-testid="preview-svg"
                  />
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="nb-card p-5 space-y-4" style={{ background: "white" }}>
              <div>
                <label className="block font-black text-sm mb-2">NAME *</label>
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
                <label className="block font-black text-sm mb-2">DESCRIPTION</label>
                <input
                  type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                  className="nb-input w-full" placeholder="A right-pointing arrow"
                  data-testid="input-icon-description"
                />
              </div>
              <div>
                <label className="block font-black text-sm mb-2">CATEGORY</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="nb-input w-full" data-testid="select-category">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-black text-sm mb-2">TAGS (comma-separated)</label>
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
                <label className="block font-black text-sm mb-2">LICENSE</label>
                <select value={license} onChange={(e) => setLicense(e.target.value)} className="nb-input w-full" data-testid="select-license">
                  <option value="MIT">MIT</option>
                  <option value="Apache-2.0">Apache 2.0</option>
                  <option value="CC0">CC0 (Public Domain)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={createIcon.isPending}
                className="nb-btn w-full mt-4 text-lg font-black"
                style={{ background: "#FFE034", color: "#0A0A0A" }}
                data-testid="button-submit-upload"
              >
                {createIcon.isPending ? "UPLOADING..." : "UPLOAD ICON"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
