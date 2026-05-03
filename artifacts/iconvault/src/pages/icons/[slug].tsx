import { useState } from "react";
import { useRoute, Link } from "wouter";
import { Download, Copy, Heart, Hash, Layers, Tag, ExternalLink } from "lucide-react";
import { useGetIconBySlug, useDownloadIcon, useToggleLike, useGetSimilarIcons } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { IconCard } from "@/components/shared/IconCard";

export default function IconDetail() {
  const [, params] = useRoute("/icons/:slug");
  const slug = params?.slug || "";
  
  const { data: icon, isLoading, error } = useGetIconBySlug(slug);
  const { data: similarIcons } = useGetSimilarIcons(icon?.id || 0, { query: { enabled: !!icon?.id } });
  
  const { toast } = useToast();
  const downloadMutation = useDownloadIcon();
  const likeMutation = useToggleLike();
  
  const [likes, setLikes] = useState(0);
  const [bgColor, setBgColor] = useState<"white" | "#FFE034" | "#0A0A0A">("white");

  // Sync likes when icon loads
  if (icon && likes === 0 && icon.likes > 0) {
    setLikes(icon.likes);
  }

  const handleDownload = () => {
    if (!icon) return;
    const blob = new Blob([icon.svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${icon.slug}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    downloadMutation.mutate({ id: icon.id });
    
    toast({
      title: "DOWNLOADED",
      description: `${icon.name} grabbed successfully.`,
      className: "border-[3px] border-foreground rounded-none bg-primary text-primary-foreground font-bold shadow-[4px_4px_0_#0A0A0A]",
    });
  };

  const handleCopy = () => {
    if (!icon) return;
    navigator.clipboard.writeText(icon.svgContent);
    toast({
      title: "COPIED",
      description: "SVG code copied to clipboard.",
      className: "border-[3px] border-foreground rounded-none bg-[#4DBBFF] text-primary-foreground font-bold shadow-[4px_4px_0_#0A0A0A]",
    });
  };

  const handleLike = () => {
    if (!icon) return;
    likeMutation.mutate({ id: icon.id }, {
      onSuccess: (data) => {
        setLikes(data.likes);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-2xl font-black animate-pulse">LOADING ICON...</div>
      </div>
    );
  }

  if (error || !icon) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h1 className="text-6xl font-black mb-4">ICON NOT FOUND</h1>
        <p className="font-mono mb-8">This icon doesn't exist or was removed.</p>
        <Link href="/icons" className="nb-btn bg-primary">BROWSE ALL ICONS</Link>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-6xl mx-auto">
      <Link href="/icons" className="inline-flex items-center gap-2 font-bold mb-8 hover:underline decoration-4">
        ← BACK TO ICONS
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
        {/* Preview Area */}
        <div className="flex flex-col gap-4">
          <div 
            className="aspect-square nb-card flex items-center justify-center p-12 transition-colors duration-300"
            style={{ 
              backgroundColor: bgColor,
              color: bgColor === "#0A0A0A" ? "white" : "#0A0A0A" 
            }}
          >
            <div 
              className="w-full h-full max-w-[240px] max-h-[240px] [&>svg]:w-full [&>svg]:h-full"
              dangerouslySetInnerHTML={{ __html: icon.svgContent }}
            />
          </div>
          
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => setBgColor("white")}
              className={`w-12 h-12 border-[3px] border-foreground shadow-[2px_2px_0_#0A0A0A] bg-white ${bgColor === "white" ? "outline outline-4 outline-offset-2 outline-primary" : ""}`}
              title="White Background"
            />
            <button 
              onClick={() => setBgColor("#FFE034")}
              className={`w-12 h-12 border-[3px] border-foreground shadow-[2px_2px_0_#0A0A0A] bg-[#FFE034] ${bgColor === "#FFE034" ? "outline outline-4 outline-offset-2 outline-foreground" : ""}`}
              title="Yellow Background"
            />
            <button 
              onClick={() => setBgColor("#0A0A0A")}
              className={`w-12 h-12 border-[3px] border-foreground shadow-[2px_2px_0_#0A0A0A] bg-[#0A0A0A] ${bgColor === "#0A0A0A" ? "outline outline-4 outline-offset-2 outline-primary" : ""}`}
              title="Black Background"
            />
          </div>
        </div>

        {/* Details Area */}
        <div className="flex flex-col justify-center">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-5xl lg:text-6xl font-black uppercase break-all leading-tight">{icon.name}</h1>
            <button 
              onClick={handleLike}
              className="nb-btn bg-accent py-3 px-4 flex items-center gap-2 group ml-4 shrink-0"
              title="Like this icon"
            >
              <Heart className={`w-6 h-6 ${likes > icon.likes ? 'fill-foreground' : 'group-hover:fill-foreground/20'}`} />
              <span className="text-xl">{likes || icon.likes}</span>
            </button>
          </div>
          
          {icon.description && (
            <p className="text-lg font-medium mb-6 opacity-80">{icon.description}</p>
          )}

          <div className="flex flex-wrap gap-2 mb-8">
            {icon.tags.map(tag => (
              <span key={tag} className="nb-badge bg-secondary text-sm px-3 py-1">
                <Hash className="w-3 h-3 inline mr-1" />{tag}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8 font-mono text-sm border-[3px] border-foreground p-6 bg-card shadow-[4px_4px_0_#0A0A0A]">
            <div className="flex flex-col gap-1">
              <span className="opacity-50 font-bold flex items-center gap-1"><Layers className="w-4 h-4" /> CATEGORY</span>
              <span className="font-bold text-lg">{icon.category}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="opacity-50 font-bold flex items-center gap-1"><Tag className="w-4 h-4" /> STYLE</span>
              <span className="font-bold text-lg uppercase">{icon.style}</span>
            </div>
            <div className="flex flex-col gap-1 mt-4">
              <span className="opacity-50 font-bold flex items-center gap-1"><Download className="w-4 h-4" /> DOWNLOADS</span>
              <span className="font-bold text-lg">{icon.downloads}</span>
            </div>
            <div className="flex flex-col gap-1 mt-4">
              <span className="opacity-50 font-bold flex items-center gap-1"><ExternalLink className="w-4 h-4" /> LICENSE</span>
              <span className="font-bold text-lg uppercase">{icon.license}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleDownload}
              className="nb-btn bg-primary text-xl py-4 flex-1 flex justify-center items-center gap-3"
            >
              <Download className="w-6 h-6" /> DOWNLOAD SVG
            </button>
            <button 
              onClick={handleCopy}
              className="nb-btn bg-card text-xl py-4 flex-1 flex justify-center items-center gap-3"
            >
              <Code2 className="w-6 h-6" /> COPY CODE
            </button>
          </div>
        </div>
      </div>

      {/* Similar Icons */}
      {similarIcons && similarIcons.length > 0 && (
        <section>
          <div className="border-t-[4px] border-foreground pt-12 mb-8">
            <h2 className="text-4xl font-black">SIMILAR ICONS</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {similarIcons.map((similar, i) => (
              <IconCard key={similar.id} icon={similar} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
