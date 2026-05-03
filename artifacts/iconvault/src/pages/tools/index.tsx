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
    description: "Hapus kode berlebih, hapus komentar, minify. Bikin SVG kamu sekecil mungkin.",
    icon: Minimize2,
  },
  {
    id: "color-converter",
    name: "Konverter Warna",
    description: "HEX ke RGB ke HSL. Lihat rasio kontras seketika.",
    icon: PaintBucket,
  },
  {
    id: "image-converter",
    name: "Konverter Gambar",
    description: "PNG ke WebP, JPG ke PNG. Di browser, super cepat.",
    icon: ImageIcon,
  },
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Format, minify, dan validasi JSON secara instan.",
    icon: Code2,
  },
  {
    id: "base64",
    name: "Base64 Encoder/Decoder",
    description: "Encode string atau file ke Base64 dan sebaliknya.",
    icon: Binary,
  },
  {
    id: "css-shadow-generator",
    name: "CSS Shadow Generator",
    description: "Buat box-shadow neo-brutalis dan standar secara visual.",
    icon: BoxSelect,
  },
  {
    id: "favicon-generator",
    name: "Favicon Generator",
    description: "Konversi SVG atau PNG jadi favicon berbagai ukuran.",
    icon: AppWindow,
  },
  {
    id: "gradient-generator",
    name: "Gradient Generator",
    description: "Kadang kamu butuh gradient. Kami paham, kami bantu.",
    icon: Palette,
  }
];

const ACCENT_COLORS = ['#FFE034', '#FF6B9D', '#4DBBFF', '#00E676', '#FF6B35', '#FFE034', '#FF6B9D', '#4DBBFF'];

export default function ToolsHub() {
  return (
    <div className="py-8 max-w-6xl mx-auto">
      <div className="mb-12">
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-4 inline-block bg-primary border-[4px] border-foreground px-6 py-2 shadow-[6px_6px_0_#0A0A0A]">
          TOOLS GRATIS
        </h1>
        <p className="text-xl md:text-2xl font-medium max-w-2xl mt-6">
          Tools browser langsung pakai. Tanpa upload ke server, tanpa nunggu. Semua jalan di browser kamu.
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
                    PAKAI TOOL <span className="text-xl leading-none">→</span>
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
