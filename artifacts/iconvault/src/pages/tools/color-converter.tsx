import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Copy, PaintBucket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Helper functions for color conversion
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function getLuminance(r: number, g: number, b: number) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(l1: number, l2: number) {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export default function ColorConverter() {
  const { toast } = useToast();
  const [color, setColor] = useState("#FFE034"); // Default IconVault yellow
  const [inputText, setInputText] = useState("#FFE034");
  
  // Derived colors
  const rgb = hexToRgb(color) || { r: 0, g: 0, b: 0 };
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  const formats = {
    hex: color.toUpperCase(),
    rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`
  };

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  const contrastWithWhite = getContrastRatio(luminance, 1);
  const contrastWithBlack = getContrastRatio(luminance, 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    
    // Basic hex validation
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      setColor(val);
    } else if (/^[0-9A-F]{6}$/i.test(val)) {
      setColor("#" + val);
      setInputText("#" + val);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "COPIED",
      description: `${label} copied to clipboard.`,
      className: "border-[3px] border-foreground rounded-none bg-card text-foreground font-bold shadow-[4px_4px_0_#0A0A0A]",
    });
  };

  return (
    <div className="py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <Link href="/tools" className="font-bold hover:underline decoration-4 mb-6 inline-block">← BACK TO TOOLS</Link>
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-[#FF6B9D] border-[3px] border-foreground flex items-center justify-center shadow-[2px_2px_0_#0A0A0A]">
            <PaintBucket className="w-6 h-6 text-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase">Color Converter</h1>
        </div>
        <p className="font-mono text-lg">Translate HEX to RGB, HSL, and check contrast instantly.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <div className="nb-card p-6 flex flex-col gap-4 bg-card">
            <h2 className="text-xl font-black">CHOOSE COLOR</h2>
            
            <div className="flex gap-4">
              <input 
                type="color" 
                value={color}
                onChange={(e) => { setColor(e.target.value); setInputText(e.target.value.toUpperCase()); }}
                className="w-16 h-16 p-0 border-[3px] border-foreground cursor-pointer shadow-[4px_4px_0_#0A0A0A]"
              />
              <input 
                type="text" 
                value={inputText}
                onChange={handleInputChange}
                className="nb-input flex-1 text-2xl font-black uppercase font-mono"
                placeholder="#FFFFFF"
              />
            </div>
          </div>

          <div className="nb-card overflow-hidden">
            <div 
              className="h-64 w-full flex items-center justify-center border-b-[3px] border-foreground transition-colors duration-200"
              style={{ backgroundColor: color }}
            >
              <span 
                className="text-4xl font-black mix-blend-difference text-white opacity-80"
                style={{ color: luminance > 0.5 ? 'black' : 'white' }}
              >
                PREVIEW
              </span>
            </div>
            
            <div className="grid grid-cols-2 text-center font-mono font-bold text-sm">
              <div className="p-4 border-r-[3px] border-foreground bg-white text-black flex flex-col justify-center gap-1">
                <span className="opacity-50">vs WHITE</span>
                <span className="text-2xl">{contrastWithWhite.toFixed(2)}:1</span>
                <span className={`text-[10px] px-2 py-1 border-[2px] border-black mt-2 inline-block mx-auto ${contrastWithWhite >= 4.5 ? 'bg-[#00E676]' : 'bg-[#FF6B35] text-white'}`}>
                  {contrastWithWhite >= 4.5 ? 'PASS (AA)' : 'FAIL'}
                </span>
              </div>
              <div className="p-4 bg-black text-white flex flex-col justify-center gap-1">
                <span className="opacity-50">vs BLACK</span>
                <span className="text-2xl">{contrastWithBlack.toFixed(2)}:1</span>
                <span className={`text-[10px] px-2 py-1 border-[2px] border-white mt-2 inline-block mx-auto ${contrastWithBlack >= 4.5 ? 'bg-[#00E676] text-black' : 'bg-[#FF6B35] text-white'}`}>
                  {contrastWithBlack >= 4.5 ? 'PASS (AA)' : 'FAIL'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-black">FORMATS</h2>
          
          {(Object.entries(formats) as [keyof typeof formats, string][]).map(([key, value]) => (
            <div key={key} className="nb-card bg-card p-4 flex items-center justify-between group hover:-translate-y-1 transition-transform">
              <div className="flex flex-col">
                <span className="font-black text-sm uppercase opacity-50 mb-1">{key}</span>
                <span className="font-mono text-xl font-bold">{value}</span>
              </div>
              <button 
                onClick={() => handleCopy(value, key.toUpperCase())}
                className="nb-btn bg-[#FF6B9D] p-3 shadow-[2px_2px_0_#0A0A0A] opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                aria-label={`Copy ${key}`}
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
