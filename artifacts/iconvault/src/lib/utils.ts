import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeSvg(svg: string): string {
  return svg.replace(/<svg([^>]*)>/i, (_match, attrs: string) => {
    const getAttr = (name: string) => {
      const m = attrs.match(new RegExp(`\\b${name}\\s*=\\s*["']?([\\d.]+)`, "i"));
      return m ? m[1] : null;
    };
    const hasViewBox = /\bviewBox\s*=/i.test(attrs);
    const w = getAttr("width");
    const h = getAttr("height");
    let cleaned = attrs
      .replace(/\bwidth\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/\bheight\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    if (!hasViewBox && w && h) {
      cleaned += ` viewBox="0 0 ${w} ${h}"`;
    }
    return `<svg${cleaned} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">`;
  });
}
