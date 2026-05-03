import { useState, useRef } from "react";
import { Link } from "wouter";
import { Download, Image as ImageIcon, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Format = "image/png" | "image/jpeg" | "image/webp";

export default function ImageConverter() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [format, setFormat] = useState<Format>("image/webp");
  const [quality, setQuality] = useState<number>(0.8);
  const [isConverting, setIsConverting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({
        title: "ERROR",
        description: "Please drop an image file.",
        variant: "destructive",
        className: "border-[3px] border-foreground rounded-none bg-destructive text-destructive-foreground font-bold shadow-[4px_4px_0_#0A0A0A]",
      });
      return;
    }
    
    setOriginalFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConvert = () => {
    if (!imageSrc || !originalFile) return;
    
    setIsConverting(true);
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Fill white background for JPEGs (which don't support transparency)
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (!blob) {
          setIsConverting(false);
          return;
        }
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const extension = format.split('/')[1];
        const newName = originalFile.name.replace(/\.[^/.]+$/, "") + "." + extension;
        a.download = newName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setIsConverting(false);
        toast({
          title: "SUCCESS",
          description: `Image converted to ${extension.toUpperCase()} successfully.`,
          className: "border-[3px] border-foreground rounded-none bg-[#00E676] text-foreground font-bold shadow-[4px_4px_0_#0A0A0A]",
        });
      }, format, quality);
    };
    img.src = imageSrc;
  };

  return (
    <div className="py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/tools" className="font-bold hover:underline decoration-4 mb-6 inline-block">← BACK TO TOOLS</Link>
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-[#4DBBFF] border-[3px] border-foreground flex items-center justify-center shadow-[2px_2px_0_#0A0A0A]">
            <ImageIcon className="w-6 h-6 text-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase">Image Converter</h1>
        </div>
        <p className="font-mono text-lg">Convert images locally in your browser. Fast and private.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="md:col-span-3 flex flex-col gap-4">
          <div 
            className={`nb-card border-dashed border-4 flex flex-col items-center justify-center p-12 min-h-[400px] text-center transition-colors
              ${!imageSrc ? 'cursor-pointer hover:bg-secondary' : 'bg-card'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !imageSrc && fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
            />
            
            {imageSrc ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img src={imageSrc} alt="Preview" className="max-w-full max-h-[300px] object-contain border-[3px] border-foreground shadow-[4px_4px_0_#0A0A0A]" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setImageSrc(null); setOriginalFile(null); }}
                  className="absolute top-0 right-0 nb-btn bg-destructive text-white py-1 px-2 text-xs"
                >
                  CLEAR
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 mb-4 opacity-50" />
                <h3 className="text-2xl font-black mb-2 uppercase">DROP IMAGE HERE</h3>
                <p className="font-mono text-sm opacity-80">or click to browse files</p>
              </>
            )}
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col gap-6 bg-card nb-card p-6">
          <h2 className="text-2xl font-black border-b-[3px] border-foreground pb-2">SETTINGS</h2>
          
          <div className="flex flex-col gap-2">
            <label className="font-bold">OUTPUT FORMAT</label>
            <select 
              className="nb-input font-bold"
              value={format}
              onChange={(e) => setFormat(e.target.value as Format)}
            >
              <option value="image/webp">WEBP</option>
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPG / JPEG</option>
            </select>
          </div>

          {(format === 'image/jpeg' || format === 'image/webp') && (
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex justify-between items-center">
                <label className="font-bold">QUALITY</label>
                <span className="font-mono nb-badge bg-primary">{Math.round(quality * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="1" 
                step="0.1" 
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full accent-foreground h-2 bg-secondary border-[2px] border-foreground appearance-none outline-none"
              />
            </div>
          )}

          <div className="mt-auto pt-6 border-t-[3px] border-foreground">
            {originalFile && (
              <div className="font-mono text-sm mb-4">
                <strong>FILE:</strong> <span className="truncate block">{originalFile.name}</span>
                <strong>SIZE:</strong> {(originalFile.size / 1024).toFixed(1)} KB
              </div>
            )}
            <button 
              onClick={handleConvert}
              disabled={!imageSrc || isConverting}
              className="nb-btn bg-[#4DBBFF] w-full text-xl py-4 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-5 h-5" /> 
              {isConverting ? "CONVERTING..." : "DOWNLOAD"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
