import { Link } from "wouter";
import { ArrowRight, PaintBucket, Minimize2, Image as ImageIcon, Wrench } from "lucide-react";
import { useGetFeaturedIcons, useGetIconStats } from "@workspace/api-client-react";
import { IconCard } from "@/components/shared/IconCard";

export default function Home() {
  const { data: featuredIcons, isLoading: loadingIcons } = useGetFeaturedIcons();
  const { data: stats, isLoading: loadingStats } = useGetIconStats();

  return (
    <div className="flex flex-col gap-24 py-8">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto flex flex-col items-center">
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-primary translate-x-3 translate-y-3 border-[4px] border-foreground"></div>
          <h1 className="relative text-6xl md:text-8xl font-black bg-card px-6 py-4 border-[4px] border-foreground uppercase tracking-tight">
            IKON GRATIS. <br/>TANPA RIBET.
          </h1>
        </div>
        <p className="text-xl md:text-2xl font-medium max-w-2xl mb-12 leading-relaxed">
          Gudang ikon brutalis untuk developer. SVG bersih, tanpa tracking, dan tools browser langsung pakai.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/icons" className="nb-btn bg-accent text-xl py-4 px-12 inline-flex items-center gap-3">
            JELAJAHI IKON <ArrowRight className="w-6 h-6" />
          </Link>
          <Link href="/tools" className="nb-btn text-xl py-4 px-12 inline-flex items-center gap-3" style={{ background: "#4DBBFF" }}>
            JELAJAHI TOOLS <Wrench className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 border-[4px] border-foreground">
          <div className="bg-primary p-6 border-b-[4px] md:border-b-0 md:border-r-[4px] border-foreground text-center">
            <div className="font-mono text-sm font-bold mb-1">TOTAL IKON</div>
            <div className="text-4xl font-black">{loadingStats ? "..." : stats?.totalIcons || "500+"}</div>
          </div>
          <div className="bg-accent p-6 border-b-[4px] md:border-b-0 md:border-r-[4px] border-foreground text-center">
            <div className="font-mono text-sm font-bold mb-1">UNDUHAN</div>
            <div className="text-4xl font-black">{loadingStats ? "..." : stats?.totalDownloads || "10K+"}</div>
          </div>
          <div className="bg-[#4DBBFF] p-6 border-r-[4px] border-foreground text-center">
            <div className="font-mono text-sm font-bold mb-1">TOOLS GRATIS</div>
            <div className="text-4xl font-black">8</div>
          </div>
          <div className="bg-[#00E676] p-6 text-center flex flex-col justify-center">
            <div className="font-mono text-sm font-bold mb-1">HARGA</div>
            <div className="text-4xl font-black">GRATIS!</div>
          </div>
        </div>
      </section>

      {/* Featured Icons */}
      <section>
        <div className="flex justify-between items-end mb-8 border-b-[4px] border-foreground pb-4">
          <h2 className="text-4xl font-black">IKON UNGGULAN</h2>
          <Link href="/icons" className="font-bold hover:underline decoration-4 hidden md:block">LIHAT SEMUA →</Link>
        </div>
        
        {loadingIcons ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="nb-card h-48 bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {(Array.isArray(featuredIcons) ? featuredIcons : []).slice(0, 8).map((icon, i) => (
              <IconCard key={icon.id} icon={icon} index={i} />
            ))}
          </div>
        )}
        <div className="mt-8 text-center md:hidden">
          <Link href="/icons" className="nb-btn bg-card inline-block">LIHAT SEMUA IKON →</Link>
        </div>
      </section>

      {/* Tools Preview */}
      <section>
        <div className="flex justify-between items-end mb-8 border-b-[4px] border-foreground pb-4">
          <h2 className="text-4xl font-black">TOOLS DEV</h2>
          <Link href="/tools" className="font-bold hover:underline decoration-4 hidden md:block">SEMUA TOOLS →</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="nb-card bg-card flex flex-col h-full group hover:-translate-y-1 transition-transform">
            <div className="h-3 w-full border-b-[3px] border-foreground bg-primary" />
            <div className="p-6 flex-1 flex flex-col">
              <Minimize2 className="w-10 h-10 mb-4" />
              <h3 className="text-2xl font-black mb-2">SVG Optimizer</h3>
              <p className="font-mono text-sm mb-6 flex-1">Hapus kode berlebih, hapus komentar, minify. Bikin SVG kamu sekecil mungkin.</p>
              <Link href="/tools/svg-optimizer" className="nb-btn bg-primary w-full text-center mt-auto">PAKAI TOOL →</Link>
            </div>
          </div>

          <div className="nb-card bg-card flex flex-col h-full group hover:-translate-y-1 transition-transform">
            <div className="h-3 w-full border-b-[3px] border-foreground bg-accent" />
            <div className="p-6 flex-1 flex flex-col">
              <PaintBucket className="w-10 h-10 mb-4" />
              <h3 className="text-2xl font-black mb-2">Konverter Warna</h3>
              <p className="font-mono text-sm mb-6 flex-1">HEX ke RGB ke HSL. Lihat rasio kontras seketika.</p>
              <Link href="/tools/color-converter" className="nb-btn bg-accent w-full text-center mt-auto">PAKAI TOOL →</Link>
            </div>
          </div>

          <div className="nb-card bg-card flex flex-col h-full group hover:-translate-y-1 transition-transform">
            <div className="h-3 w-full border-b-[3px] border-foreground bg-[#4DBBFF]" />
            <div className="p-6 flex-1 flex flex-col">
              <ImageIcon className="w-10 h-10 mb-4" />
              <h3 className="text-2xl font-black mb-2">Konverter Gambar</h3>
              <p className="font-mono text-sm mb-6 flex-1">PNG ke WebP, JPG ke PNG. Di browser, super cepat.</p>
              <Link href="/tools/image-converter" className="nb-btn bg-[#4DBBFF] w-full text-center mt-auto">PAKAI TOOL →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-foreground text-background p-12 md:p-20 text-center border-[4px] border-foreground relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-4xl md:text-6xl font-black mb-6 uppercase">BERHENTI CARI-CARI.<br/>LANGSUNG BANGUN.</h2>
          <Link href="/icons" className="nb-btn bg-primary text-foreground text-xl py-4 px-8 inline-block hover:bg-primary/90">
            JELAJAHI IKON →
          </Link>
        </div>
      </section>
    </div>
  );
}
