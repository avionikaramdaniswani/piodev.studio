import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function CssShadowGenerator() {
  const [x, setX] = useState(4);
  const [y, setY] = useState(4);
  const [blur, setBlur] = useState(0);
  const [spread, setSpread] = useState(0);
  const [color, setColor] = useState("#0A0A0A");
  const [inset, setInset] = useState(false);
  const { toast } = useToast();

  const cssValue = `${inset ? "inset " : ""}${x}px ${y}px ${blur}px ${spread}px ${color}`;
  const cssCode = `box-shadow: ${cssValue};`;

  const applyNeoPreset = () => {
    setX(4); setY(4); setBlur(0); setSpread(0); setColor("#0A0A0A"); setInset(false);
  };

  const copyCSS = () => {
    navigator.clipboard.writeText(cssCode);
    toast({ title: "Copied!", description: "CSS code copied to clipboard." });
  };

  return (
    <div className="min-h-screen" style={{ background: "#FFFBF0" }}>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-10">
          <span className="nb-badge" style={{ background: "#FFE034" }}>CSS Tool</span>
          <h1 className="text-5xl font-black mt-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#0A0A0A" }}>
            BOX-SHADOW GENERATOR
          </h1>
          <p className="text-lg mt-2" style={{ color: "#3D3D3D" }}>Build CSS box-shadows with live preview. Neo Brutalism preset included.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="nb-card p-6 space-y-6" style={{ background: "white" }}>
            <div className="flex gap-3 mb-6">
              <button onClick={applyNeoPreset} className="nb-btn" style={{ background: "#FFE034", color: "#0A0A0A" }} data-testid="button-neo-preset">
                NEO BRUTALISM PRESET
              </button>
            </div>

            {[
              { label: "X OFFSET", val: x, set: setX, min: -50, max: 50 },
              { label: "Y OFFSET", val: y, set: setY, min: -50, max: 50 },
              { label: "BLUR RADIUS", val: blur, set: setBlur, min: 0, max: 50 },
              { label: "SPREAD RADIUS", val: spread, set: setSpread, min: -20, max: 20 },
            ].map(({ label, val, set, min, max }) => (
              <div key={label}>
                <label className="block font-black text-sm mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{label}: <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{val}px</span></label>
                <input
                  type="range" min={min} max={max} value={val}
                  onChange={(e) => set(Number(e.target.value))}
                  className="w-full" style={{ accentColor: "#FFE034" }}
                  data-testid={`slider-${label.toLowerCase().replace(" ", "-")}`}
                />
              </div>
            ))}

            <div>
              <label className="block font-black text-sm mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>COLOR</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color" value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="nb-input w-16 h-12 p-1 cursor-pointer"
                  data-testid="input-shadow-color"
                />
                <input
                  type="text" value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="nb-input flex-1 font-mono"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  data-testid="input-shadow-color-hex"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="inset" checked={inset} onChange={(e) => setInset(e.target.checked)} className="w-5 h-5" data-testid="checkbox-inset" />
              <label htmlFor="inset" className="font-black" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>INSET</label>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <div className="nb-card p-8 flex items-center justify-center" style={{ background: "#F5F0E8", minHeight: 220 }}>
              <div
                className="w-48 h-32 flex items-center justify-center font-black text-lg"
                style={{
                  background: "white",
                  border: "3px solid #0A0A0A",
                  boxShadow: cssValue,
                  fontFamily: "'Space Grotesk', sans-serif",
                  color: "#0A0A0A",
                }}
                data-testid="preview-shadow-box"
              >
                PREVIEW
              </div>
            </div>

            <div className="nb-card p-4" style={{ background: "white" }}>
              <p className="font-black text-sm mb-2">GENERATED CSS</p>
              <pre className="p-3 text-sm overflow-x-auto" style={{ fontFamily: "'JetBrains Mono', monospace", background: "#F5F0E8", border: "2px solid #0A0A0A" }}>
                {cssCode}
              </pre>
              <button onClick={copyCSS} className="nb-btn mt-3 w-full" style={{ background: "#00E676", color: "#0A0A0A" }} data-testid="button-copy-css">
                COPY CSS CODE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
