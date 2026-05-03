import { Sparkles } from "lucide-react";
import type { UserTier } from "@/contexts/AuthContext";

interface TierBadgeProps {
  tier: UserTier | null;
  size?: "xs" | "sm" | "md";
}

export function TierBadge({ tier, size = "sm" }: TierBadgeProps) {
  if (!tier) return null;

  const isPlus = tier === "plus";
  const sizes = {
    xs: "text-[9px] px-1.5 py-0.5 border-[1.5px]",
    sm: "text-[10px] px-2 py-0.5 border-[2px]",
    md: "text-sm px-3 py-1 border-[3px]",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-black uppercase font-mono ${sizes[size]} border-foreground shadow-[1px_1px_0_#0A0A0A]`}
      style={{
        background: isPlus ? "#FFE034" : "#e5e5e5",
        color: "#0A0A0A",
      }}
    >
      {isPlus && <Sparkles className="w-2.5 h-2.5" />}
      {isPlus ? "PLUS" : "FREE"}
    </span>
  );
}
