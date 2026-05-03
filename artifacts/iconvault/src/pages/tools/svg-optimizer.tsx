import { useState } from "react";
import { Link } from "wouter";
import { Download, Copy, Minimize2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SVGOptimizer() {
  const { toast } = useToast();
  const [inputSVG, setInputSVG] = useState("");
  const [outputSVG, setOutputSVG] = useState("");
  const [originalSize, setOriginalSize] = useState(0);
  const [optimizedSize, setOptimizedSize] = useState(0);

  const optimizeSVG = () => {
    if (!inputSVG.trim()) return;
    
    setOriginalSize(new Blob([inputSVG]).size);
    
    // Very basic manual optimization for demonstration
    // In a real prod app we'd use svgo in the browser
    let optimized = inputSVG
      // Remove XML declaration
      .replace(/<\?xml.*?\?>/gi, '')
      // Remove comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove DOCTYPE
      .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
      // Remove empty text tags
      .replace(/<text[^>]*>\s*<\/text>/gi, '')
      // Remove empty tspan tags
      .replace(/<tspan[^>]*>\s*<\/tspan>/gi, '')
      // Remove hidden elements
      .replace(/display="none"/gi, '')
      // Remove newlines and extra spaces
      .replace(/>\s+</g, '><')
      .replace(/\s{2,}/g, ' ')
      .trim();

    setOutputSVG(optimized);
    setOptimizedSize(new Blob([optimized]).size);
  };

  const handleCopy = () => {
    if (!outputSVG) return;
    navigator.clipboard.writeText(outputSVG);
    toast({
      title: "COPIED",
      description: "Optimized SVG copied to clipboard.",
      className: "border-[3px] border-foreground rounded-none bg-primary text-primary-foreground font-bold shadow-[4px_4px_0_#0A0A0A]",
    });
  };

  const handleDownload = () => {
    if (!outputSVG) return;
    const blob = new Blob([outputSVG], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "optimized.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const calculateSavings = () => {
    if (originalSize === 0) return 0;
    return Math.round(((originalSize - optimizedSize) / originalSize) * 100);
  };

  return (
    <div className="py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <Link href="/tools" className="font-bold hover:underline decoration-4 mb-6 inline-block">← BACK TO TOOLS</Link>
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-[#FFE034] border-[3px] border-foreground flex items-center justify-center shadow-[2px_2px_0_#0A0A0A]">
            <Minimize2 className="w-6 h-6 text-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase">SVG Optimizer</h1>
        </div>
        <p className="font-mono text-lg">Strip bloat and minify SVGs right in your browser.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-black">INPUT</h2>
            {originalSize > 0 && <span className="nb-badge bg-secondary">{originalSize} bytes</span>}
          </div>
          <textarea 
            value={inputSVG}
            onChange={(e) => setInputSVG(e.target.value)}
            placeholder="Paste your nasty bloated SVG code here..."
            className="nb-input min-h-[400px] font-mono text-sm resize-y"
          />
          <button 
            onClick={optimizeSVG}
            disabled={!inputSVG.trim()}
            className="nb-btn bg-primary text-xl py-4 w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            OPTIMIZE SVG <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Output */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-black">OUTPUT</h2>
            {optimizedSize > 0 && (
              <div className="flex items-center gap-2">
                <span className="nb-badge bg-card">{optimizedSize} bytes</span>
                <span className="nb-badge bg-[#00E676] text-foreground border-foreground">-{calculateSavings()}%</span>
              </div>
            )}
          </div>
          <textarea 
            value={outputSVG}
            readOnly
            placeholder="Optimized code will appear here..."
            className="nb-input min-h-[400px] font-mono text-sm resize-y bg-secondary/50 focus:outline-none focus:shadow-[4px_4px_0_#0A0A0A]"
          />
          <div className="flex gap-4">
            <button 
              onClick={handleCopy}
              disabled={!outputSVG}
              className="nb-btn bg-card flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Copy className="w-5 h-5" /> COPY
            </button>
            <button 
              onClick={handleDownload}
              disabled={!outputSVG}
              className="nb-btn bg-accent flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-5 h-5" /> DOWNLOAD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
