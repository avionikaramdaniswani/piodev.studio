import { useState } from "react";
import { Link } from "wouter";
import { Download, Heart } from "lucide-react";
import type { Icon } from "@workspace/api-client-react";
import { useDownloadIcon, useToggleLike } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const ACCENT_COLORS = ['#FFE034', '#FF6B9D', '#4DBBFF', '#00E676', '#FF6B35'];

interface IconCardProps {
  icon: Icon;
  index: number;
}

export function IconCard({ icon, index }: IconCardProps) {
  const { toast } = useToast();
  const [likes, setLikes] = useState(icon.likes);
  const downloadMutation = useDownloadIcon();
  const likeMutation = useToggleLike();
  
  const accentColor = ACCENT_COLORS[index % ACCENT_COLORS.length];

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Create blob and download
    const blob = new Blob([icon.svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${icon.slug}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Track download
    downloadMutation.mutate({ id: icon.id });
    
    toast({
      title: "DOWNLOADED",
      description: `${icon.name} grabbed successfully.`,
      className: "border-[3px] border-foreground rounded-none bg-primary text-primary-foreground font-bold shadow-[4px_4px_0_#0A0A0A]",
    });
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    likeMutation.mutate({ id: icon.id }, {
      onSuccess: (data) => {
        setLikes(data.likes);
      }
    });
  };

  return (
    <Link href={`/icons/${icon.slug}`} className="group block">
      <div className="nb-card h-full flex flex-col relative overflow-hidden transition-transform duration-200 group-hover:-translate-y-1 group-hover:shadow-[6px_6px_0_#0A0A0A]">
        {/* Accent Strip */}
        <div className="h-3 w-full border-b-[3px] border-foreground" style={{ backgroundColor: accentColor }} />
        
        {/* SVG Preview */}
        <div className="flex-1 flex items-center justify-center p-8 bg-card border-b-[3px] border-foreground relative">
          <div 
            className="w-16 h-16 [&>svg]:w-full [&>svg]:h-full [&>svg]:text-foreground"
            dangerouslySetInnerHTML={{ __html: icon.svgContent }}
          />
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
            <button 
              onClick={handleDownload}
              className="nb-btn bg-primary py-2 px-4 flex items-center gap-2"
              data-testid={`btn-quick-download-${icon.id}`}
            >
              <Download className="w-4 h-4" /> SVG
            </button>
          </div>
        </div>
        
        {/* Details */}
        <div className="p-3 bg-secondary">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm truncate pr-2" title={icon.name}>{icon.name}</h3>
            <button 
              onClick={handleLike}
              className="flex items-center gap-1 hover:text-accent transition-colors"
              data-testid={`btn-like-${icon.id}`}
            >
              <Heart className="w-4 h-4" />
              <span className="font-mono text-xs font-bold">{likes}</span>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="nb-badge bg-card text-[10px]">{icon.category}</span>
            <span className="font-mono text-[10px] font-bold opacity-60 flex items-center gap-1">
              <Download className="w-3 h-3" /> {icon.downloads}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
