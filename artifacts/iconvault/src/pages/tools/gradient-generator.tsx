import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const PRESETS = [
  { name: "Sunset", c1: "#FF6B35", c2: "#FF6B9D", deg: 135 },
  { name: "Ocean", c1: "#4DBBFF", c2: "#00E676", deg: 45 },
  { name: "Gold", c1: "#FFE034", c2: "#FF6B35", deg: 90 },
  { name: "Night", c1: "#0A0A0A", c2: "#3D3D3D", deg: 180 },
  { name: "Candy", c1: "#FF6B9D", c2: "#4DBBFF", deg: 315 },
];

export default function GradientGenerator() {
  const [color1, setColor1] = useState("#FFE034");
  const [color2, setColor2] = useState("#FF6B9D");
  const [color3, setColor3] = useState("");
  const [deg, setDeg] = useState(135);
  const [useThree, setUseThree] = useState(false);
  const { toast } = useToast();

  const gradientValue = useThree && color3
    ? `linear-gradient(${deg}deg, ${color1}, ${color3}, ${color2})`
    : `linear-gradient(${deg}deg, ${color1}, ${color2})`;
  const cssCode = `background: ${gradientValue};`;

  const copy = () => {
    navigator.clipboard.writeText(cssCode);
    toast({ title: "Copied!", description: "Gradient CSS copied." });
  };

  const applyPreset = (p: typeof PRESETS[0]) => {
    setColor1(p.c1); setColor2(p.c2); setDeg(p.deg); setUseThree(false);
  };

  return (
    <div className="min-h-screen" style={{ background: "#FFFBF0" }}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10">
          <span className="nb-badge" style={{ background: "#FF6B9D", color: "#0A0A0A" }}>CSS Tool</span>
          <h1 className="text-5xl font-black mt-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#0A0A0A" }}>
            GRADIENT GENERATOR
          </h1>
          <p className="text-lg mt-2" style={{ color: "#3D3D3D" }}>
            Ironic: generating gradients on a zero-gradient UI. You're welcome.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Presets */}
            <div className="nb-card p-4" style={{ background: "white" }}>
              <p className="font-black text-sm mb-3">PRESETS</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button key={p.name} onClick={() => applyPreset(p)} className="nb-btn text-sm" style={{ padding: "6px 14px", background: "#F5F0E8" }} data-testid={`button-preset-${p.name.toLowerCase()}`}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="nb-card p-5 space-y-4" style={{ background: "white" }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-black text-sm mb-2">COLOR 1</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={color1} onChange={(e) => setColor1(e.target.value)} className="nb-input w-12 h-10 p-1 cursor-pointer" data-testid="input-color1" />
                    <input type="text" value={color1} onChange={(e) => setColor1(e.target.value)} className="nb-input flex-1 text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }} data-testid="input-color1-hex" />
                  </div>
                </div>
                <div>
                  <label className="block font-black text-sm mb-2">COLOR 2</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={color2} onChange={(e) => setColor2(e.target.value)} className="nb-input w-12 h-10 p-1 cursor-pointer" data-testid="input-color2" />
                    <input type="text" value={color2} onChange={(e) => setColor2(e.target.value)} className="nb-input flex-1 text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }} data-testid="input-color2-hex" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="three" checked={useThree} onChange={(e) => setUseThree(e.target.checked)} className="w-5 h-5" data-testid="checkbox-three-colors" />
                <label htmlFor="three" className="font-black text-sm">ADD MIDDLE COLOR</label>
              </div>

              {useThree && (
                <div>
                  <label className="block font-black text-sm mb-2">MIDDLE COLOR</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={color3 || "#ffffff"} onChange={(e) => setColor3(e.target.value)} className="nb-input w-12 h-10 p-1 cursor-pointer" data-testid="input-color3" />
                    <input type="text" value={color3} onChange={(e) => setColor3(e.target.value)} className="nb-input flex-1 text-sm" placeholder="#ffffff" style={{ fontFamily: "'JetBrains Mono', monospace" }} data-testid="input-color3-hex" />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-black text-sm mb-2">DIRECTION: <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{deg}deg</span></label>
                <input type="range" min={0} max={360} value={deg} onChange={(e) => setDeg(Number(e.target.value))} className="w-full" style={{ accentColor: "#FFE034" }} data-testid="slider-direction" />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {/* Live preview */}
            <div className="nb-card overflow-hidden" style={{ height: 200 }}>
              <div className="w-full h-full" style={{ background: gradientValue }} data-testid="preview-gradient" />
            </div>

            {/* CSS output */}
            <div className="nb-card p-4" style={{ background: "white" }}>
              <p className="font-black text-sm mb-2">GENERATED CSS</p>
              <pre className="p-3 text-sm overflow-x-auto" style={{ fontFamily: "'JetBrains Mono', monospace", background: "#F5F0E8", border: "2px solid #0A0A0A", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                {cssCode}
              </pre>
              <button onClick={copy} className="nb-btn mt-3 w-full" style={{ background: "#FFE034", color: "#0A0A0A" }} data-testid="button-copy-gradient">
                COPY CSS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
