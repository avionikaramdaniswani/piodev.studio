import { Link } from "wouter";
import { 
  Minimize2, 
  PaintBucket, 
  Image as ImageIcon, 
  Code2, 
  Binary, 
  BoxSelect, 
  AppWindow, 
  Palette 
} from "lucide-react";

const tools = [
  {
    id: "svg-optimizer",
    name: "SVG Optimizer",
    description: "Strip bloat, remove comments, minify code. Make your SVGs tiny.",
    icon: Minimize2,
  },
  {
    id: "color-converter",
    name: "Color Converter",
    description: "HEX to RGB to HSL. See contrast ratios instantly.",
    icon: PaintBucket,
  },
  {
    id: "image-converter",
    name: "Image Converter",
    description: "PNG to WebP, JPG to PNG. Browser-side, lightning fast.",
    icon: ImageIcon,
  },
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Format, minify, and validate JSON payloads instantly.",
    icon: Code2,
  },
  {
    id: "base64",
    name: "Base64 Encoder/Decoder",
    description: "Encode strings or files to Base64 and back.",
    icon: Binary,
  },
  {
    id: "css-shadow-generator",
    name: "CSS Shadow Generator",
    description: "Build neo-brutalist and standard box-shadows visually.",
    icon: BoxSelect,
  },
  {
    id: "favicon-generator",
    name: "Favicon Generator",
    description: "Convert SVGs or PNGs to multi-size favicons.",
    icon: AppWindow,
  },
  {
    id: "gradient-generator",
    name: "Gradient Generator",
    description: "Because sometimes you need a gradient even if we hate them.",
    icon: Palette,
  }
];

const ACCENT_COLORS = ['#FFE034', '#FF6B9D', '#4DBBFF', '#00E676', '#FF6B35', '#FFE034', '#FF6B9D', '#4DBBFF'];

export default function ToolsHub() {
  return (
    <div className="py-8 max-w-6xl mx-auto">
      <div className="mb-12">
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-4 inline-block bg-primary border-[4px] border-foreground px-6 py-2 shadow-[6px_6px_0_#0A0A0A]">
          FREE TOOLS
        </h1>
        <p className="text-xl md:text-2xl font-medium max-w-2xl mt-6">
          No-nonsense browser tools. No server uploads, no waiting. Everything runs locally in your browser.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tools.map((tool, i) => {
          const Icon = tool.icon;
          const accentColor = ACCENT_COLORS[i % ACCENT_COLORS.length];
          
          return (
            <Link key={tool.id} href={`/tools/${tool.id}`} className="group block h-full">
              <div className="nb-card h-full flex flex-col transition-transform duration-200 group-hover:-translate-y-2 group-hover:shadow-[8px_8px_0_#0A0A0A]">
                <div className="h-4 w-full border-b-[3px] border-foreground" style={{ backgroundColor: accentColor }} />
                <div className="p-6 flex flex-col flex-1 bg-card">
                  <div 
                    className="w-12 h-12 border-[3px] border-foreground flex items-center justify-center mb-6 shadow-[2px_2px_0_#0A0A0A]"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Icon className="w-6 h-6 text-foreground" />
                  </div>
                  <h2 className="text-xl font-black mb-2 uppercase">{tool.name}</h2>
                  <p className="font-mono text-sm opacity-80 mb-6 flex-1">{tool.description}</p>
                  <div className="font-bold text-sm flex items-center gap-2 mt-auto">
                    USE TOOL <span className="text-xl leading-none">→</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
