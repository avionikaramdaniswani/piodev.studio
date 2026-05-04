import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Download, Heart, FileImage, FileText, FileCode2, X, ChevronDown } from "lucide-react";
import { jsPDF } from "jspdf";
import type { Icon } from "@workspace/api-client-react";
import { useToggleLike } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const ACCENT_COLORS = ['#FFE034', '#FF6B9D', '#4DBBFF', '#00E676', '#FF6B35'];
const PNG_SIZES = [16, 24, 32, 48, 64, 128, 256, 512];

function svgToPngBlob(svgString: string, size: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error("Canvas toBlob failed"));
      }, "image/png");
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("SVG load failed")); };
    img.src = url;
  });
}

async function downloadAsPdf(svgString: string, filename: string) {
  const pngBlob = await svgToPngBlob(svgString, 512);
  const dataUrl = await new Promise<string>((res) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.readAsDataURL(pngBlob);
  });
  const pdf = new jsPDF({ unit: "px", format: [512, 512] });
  pdf.addImage(dataUrl, "PNG", 0, 0, 512, 512);
  pdf.save(`${filename}.pdf`);
}

interface IconCardProps {
  icon: Icon;
  index: number;
}

export function IconCard({ icon, index }: IconCardProps) {
  const { toast } = useToast();
  const { user, tier, downloadsToday, quotaLimit, refreshProfile } = useAuth();
  const [likes, setLikes] = useState(icon.likes);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedPngSize, setSelectedPngSize] = useState(64);
  const [showPngExpanded, setShowPngExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const likeMutation = useToggleLike();

  const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length];

  useEffect(() => {
    if (showDownloadModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showDownloadModal]);

  const handleOpenModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDownloadModal(true);
  };

  const handleDownloadFormat = async (format: "svg" | "png" | "pdf", pngSize?: number) => {
    if (downloading) return;
    setDownloading(true);
    setShowDownloadModal(false);

    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (s?.access_token) headers["Authorization"] = `Bearer ${s.access_token}`;

      const res = await fetch(`/api/icons/${icon.id}/download`, { method: "POST", headers });

      if (res.status === 429) {
        const data = await res.json() as { quota: number; used: number; reason?: string };
        setDownloading(false);
        if (data.reason === "anon_quota_exceeded") {
          toast({
            title: "KUOTA TAMU HABIS",
            description: "Daftar gratis untuk 50 unduhan/hari!",
            className: "border-[3px] border-foreground rounded-none font-bold shadow-[4px_4px_0_#0A0A0A]",
            style: { background: "#FF6B35", color: "white" },
          });
        } else {
          toast({
            title: "KUOTA HABIS!",
            description: `Batas ${data.quota} unduhan/hari tercapai. Upgrade ke Plus atau tunggu reset tengah malam.`,
            className: "border-[3px] border-foreground rounded-none font-bold shadow-[4px_4px_0_#0A0A0A]",
            style: { background: "#FF6B35", color: "white" },
          });
        }
        return;
      }

      if (!res.ok) {
        setDownloading(false);
        toast({
          title: "GAGAL",
          description: "Terjadi kesalahan. Coba lagi.",
          className: "border-[3px] border-foreground rounded-none bg-white font-bold shadow-[4px_4px_0_#0A0A0A]",
        });
        return;
      }

      if (user) await refreshProfile();

      const svgContent = icon.svgContent;
      const slug = icon.slug;

      if (format === "svg") {
        const blob = new Blob([svgContent], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${slug}.svg`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
      } else if (format === "png") {
        const size = pngSize ?? selectedPngSize;
        const pngBlob = await svgToPngBlob(svgContent, size);
        const url = URL.createObjectURL(pngBlob);
        const a = document.createElement("a");
        a.href = url; a.download = `${slug}-${size}.png`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
      } else if (format === "pdf") {
        await downloadAsPdf(svgContent, slug);
      }

      const isPlus = tier === "plus";
      const formatLabel = format.toUpperCase();
      if (!user) {
        const dlData = await res.json().catch(() => null) as { used?: number } | null;
        const anonRemaining = 5 - (dlData?.used ?? 1);
        toast({
          title: `DIUNDUH ${formatLabel}!`,
          description: anonRemaining > 0
            ? `Sisa ${anonRemaining} unduhan gratis hari ini.`
            : `Kuota tamu habis. Daftar gratis untuk lanjut!`,
          className: "border-[3px] border-foreground rounded-none bg-primary text-primary-foreground font-bold shadow-[4px_4px_0_#0A0A0A]",
        });
      } else {
        const remaining = isPlus ? "∞" : String(quotaLimit - downloadsToday - 1);
        toast({
          title: `DIUNDUH ${formatLabel}!`,
          description: isPlus ? `${icon.name} berhasil diunduh.` : `Sisa kuota hari ini: ${remaining}`,
          className: "border-[3px] border-foreground rounded-none bg-primary text-primary-foreground font-bold shadow-[4px_4px_0_#0A0A0A]",
        });
      }
    } catch {
      toast({
        title: "GAGAL",
        description: "Tidak bisa terhubung ke server.",
        className: "border-[3px] border-foreground rounded-none bg-white font-bold shadow-[4px_4px_0_#0A0A0A]",
      });
    }

    setDownloading(false);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    likeMutation.mutate({ id: icon.id }, {
      onSuccess: (data) => setLikes(data.likes),
    });
  };

  return (
    <>
      <Link href={`/icons/${icon.slug}`} className="group block">
        <div className="nb-card h-full flex flex-col relative overflow-hidden transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-[6px_6px_0_#0A0A0A]">
          <div className="h-3 w-full border-b-[3px] border-foreground" style={{ backgroundColor: accentColor }} />

          <div className="flex-1 flex items-center justify-center p-8 bg-card border-b-[3px] border-foreground relative">
            {/* Category badge — top-left overlay */}
            <span
              className="absolute top-2 left-2 font-black text-[9px] px-1.5 py-0.5 border-[2px] border-foreground leading-none z-10"
              style={{ background: accentColor }}
            >
              {icon.category}
            </span>

            <div
              className="w-16 h-16 [&>svg]:w-full [&>svg]:h-full [&>svg]:text-foreground"
              dangerouslySetInnerHTML={{ __html: icon.svgContent }}
            />
            <div className="absolute inset-0 bg-background/90 hidden sm:flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
              <button
                onClick={handleOpenModal}
                disabled={downloading}
                className="nb-btn bg-primary py-2 px-4 flex items-center gap-2 disabled:opacity-50"
                data-testid={`btn-quick-download-${icon.id}`}
              >
                <Download className="w-4 h-4" /> {downloading ? "..." : "UNDUH"}
              </button>
            </div>
          </div>

          <div className="px-3 py-2 bg-secondary flex items-center justify-between">
            <button
              onClick={handleLike}
              className="flex items-center gap-1 hover:text-accent transition-colors"
              data-testid={`btn-like-${icon.id}`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span className="font-mono text-xs font-bold">{likes}</span>
            </button>
            <span className="font-mono text-[10px] font-bold opacity-60 flex items-center gap-1">
              <Download className="w-3 h-3" /> {icon.downloads}
            </span>
          </div>
        </div>
      </Link>

      {showDownloadModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          style={{ background: "rgba(10,10,10,0.65)" }}
          onClick={() => setShowDownloadModal(false)}
        >
          <div
            className="border-t-[4px] sm:border-[4px] border-foreground bg-background w-full sm:max-w-sm shadow-[0_-4px_0_#0A0A0A] sm:shadow-[6px_6px_0_#0A0A0A] max-h-[82vh] overflow-y-auto [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-[3px] border-foreground px-4 py-3 sticky top-0 z-10" style={{ background: accentColor }}>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: icon.svgContent }}
                />
                <h2 className="text-base font-black tracking-tight truncate">{icon.name.toUpperCase()}</h2>
              </div>
              <button onClick={() => setShowDownloadModal(false)} className="border-[2px] border-foreground bg-white p-1 hover:bg-gray-100 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3">
              <button
                onClick={() => handleDownloadFormat("svg")}
                className="nb-btn bg-card flex items-center gap-3 text-left py-3 px-4"
              >
                <div className="border-[2px] border-foreground p-1.5 flex-shrink-0" style={{ background: "#FFE034" }}>
                  <FileCode2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-base font-black">SVG</p>
                  <p className="font-mono text-xs text-muted-foreground leading-tight">Scalable Vector — tajam di semua ukuran</p>
                </div>
              </button>

              <div className="border-[3px] border-foreground" style={{ background: "#F8F8F8" }}>
                <div className="flex items-center gap-3 p-3">
                  <div className="border-[2px] border-foreground p-1.5 flex-shrink-0" style={{ background: "#4DBBFF" }}>
                    <FileImage className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-black">PNG</p>
                    <p className="font-mono text-xs text-muted-foreground leading-tight">
                      {showPngExpanded ? "Pilih ukuran di bawah" : `Default ${selectedPngSize}px`}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPngExpanded(!showPngExpanded)}
                    className="border-[2px] border-foreground bg-white p-1 hover:bg-gray-100 flex-shrink-0"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showPngExpanded ? "rotate-180" : ""}`} />
                  </button>
                </div>
                {showPngExpanded && (
                  <div className="border-t-[2px] border-foreground p-3 pt-2">
                    <div className="grid grid-cols-4 gap-1.5 mb-3">
                      {PNG_SIZES.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedPngSize(size)}
                          className={`border-[2px] border-foreground py-1.5 font-black font-mono text-xs transition-colors ${
                            selectedPngSize === size ? "bg-foreground text-background" : "bg-white hover:bg-gray-100"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="border-t-[2px] border-foreground">
                  <button
                    onClick={() => handleDownloadFormat("png", selectedPngSize)}
                    className="nb-btn bg-primary w-full flex justify-center items-center gap-2 py-2.5 text-sm border-0"
                  >
                    <Download className="w-4 h-4" />
                    UNDUH PNG {selectedPngSize}×{selectedPngSize}
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleDownloadFormat("pdf")}
                className="nb-btn bg-card flex items-center gap-3 text-left py-3 px-4"
              >
                <div className="border-[2px] border-foreground p-1.5 flex-shrink-0" style={{ background: "#FF6B9D" }}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-base font-black">PDF</p>
                  <p className="font-mono text-xs text-muted-foreground leading-tight">512×512px — siap print & presentasi</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
