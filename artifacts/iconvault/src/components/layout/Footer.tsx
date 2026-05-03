import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-foreground text-background border-t-[3px] border-foreground mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-black mb-1">PioDev.studio</h3>
            <p className="font-mono text-sm mb-4 opacity-70">IKON GRATIS. TANPA RIBET.</p>
            <p className="font-mono text-xs opacity-50">Platform ikon SVG untuk developer Indonesia.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4 uppercase">Tautan</h4>
            <ul className="space-y-2 font-mono text-sm">
              <li><Link href="/" className="hover:text-primary transition-colors">Beranda</Link></li>
              <li><Link href="/icons" className="hover:text-primary transition-colors">Ikon</Link></li>
              <li><Link href="/tools" className="hover:text-primary transition-colors">Tools</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 uppercase">Tools</h4>
            <ul className="space-y-2 font-mono text-sm">
              <li><Link href="/tools/svg-optimizer" className="hover:text-primary transition-colors">SVG Optimizer</Link></li>
              <li><Link href="/tools/image-converter" className="hover:text-primary transition-colors">Konverter Gambar</Link></li>
              <li><Link href="/tools/base64" className="hover:text-primary transition-colors">Base64</Link></li>
              <li><Link href="/tools" className="hover:text-primary transition-colors">Tools Lainnya →</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t-[3px] border-muted-foreground/30 mt-12 pt-8 font-mono text-xs text-center">
          &copy; {new Date().getFullYear()} PioDev.studio — Dibuat dengan semangat.
        </div>
      </div>
    </footer>
  );
}
