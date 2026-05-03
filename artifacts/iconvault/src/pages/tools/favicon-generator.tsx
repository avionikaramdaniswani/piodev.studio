import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export default function FaviconGenerator() {
  const [svgInput, setSvgInput] = useState("");
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sizes = [16, 32, 48, 64];

  const renderToCanvas = (svgString: string, size: number): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, size, size);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(""); };
      img.src = url;
    });
  };

  const generate = async () => {
    if (!svgInput.trim()) {
      toast({ title: "Error", description: "Please paste SVG code first.", variant: "destructive" });
      return;
    }
    const urls: Record<number, string> = {};
    for (const size of sizes) {
      urls[size] = await renderToCanvas(svgInput, size);
    }
    setPreviewUrls(urls);
    toast({ title: "Generated!", description: "Favicon previews ready." });
  };

  const download = async (size: number) => {
    const dataUrl = previewUrls[size];
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `favicon-${size}x${size}.png`;
    a.click();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setSvgInput(ev.target?.result as string);
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen" style={{ background: "#FFFBF0" }}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10">
          <span className="nb-badge" style={{ background: "#4DBBFF" }}>SVG Tool</span>
          <h1 className="text-5xl font-black mt-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#0A0A0A" }}>
            FAVICON GENERATOR
          </h1>
          <p className="text-lg mt-2" style={{ color: "#3D3D3D" }}>Convert SVG to PNG favicons at multiple sizes.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="nb-card p-4" style={{ background: "white" }}>
              <label className="block font-black text-sm mb-2">PASTE SVG CODE</label>
              <textarea
                value={svgInput}
                onChange={(e) => setSvgInput(e.target.value)}
                className="nb-input w-full"
                rows={10}
                placeholder="<svg xmlns='http://www.w3.org/2000/svg' ...>"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
                data-testid="textarea-svg-input"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => fileRef.current?.click()} className="nb-btn flex-1" style={{ background: "#F5F0E8", color: "#0A0A0A" }} data-testid="button-upload-svg">
                UPLOAD SVG
              </button>
              <button onClick={generate} className="nb-btn flex-1" style={{ background: "#FFE034", color: "#0A0A0A" }} data-testid="button-generate-favicon">
                GENERATE
              </button>
            </div>
            <input ref={fileRef} type="file" accept=".svg,image/svg+xml" onChange={handleFile} className="hidden" data-testid="input-file-svg" />
          </div>

          <div className="nb-card p-6 space-y-4" style={{ background: "white" }}>
            <p className="font-black text-sm">PREVIEWS</p>
            {sizes.map((size) => (
              <div key={size} className="flex items-center gap-4">
                <div
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{ width: 64, height: 64, border: "2px solid #0A0A0A", background: "#F5F0E8" }}
                >
                  {previewUrls[size] ? (
                    <img src={previewUrls[size]} alt={`${size}x${size}`} style={{ width: size, height: size }} />
                  ) : (
                    <span className="text-xs" style={{ fontFamily: "'JetBrains Mono', monospace", color: "#3D3D3D" }}>{size}px</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{size}x{size}px</p>
                  <button
                    onClick={() => download(size)}
                    disabled={!previewUrls[size]}
                    className="nb-btn text-sm mt-1"
                    style={{ background: previewUrls[size] ? "#00E676" : "#F5F0E8", color: "#0A0A0A", padding: "4px 12px" }}
                    data-testid={`button-download-${size}`}
                  >
                    DOWNLOAD PNG
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
