import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <div className="text-center max-w-lg">
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-primary translate-x-3 translate-y-3 border-[4px] border-foreground" />
          <h1 className="relative text-8xl md:text-9xl font-black bg-card px-8 py-4 border-[4px] border-foreground">
            404
          </h1>
        </div>
        <h2 className="text-3xl font-black mb-4 uppercase">Halaman Tidak Ditemukan</h2>
        <p className="font-mono text-sm opacity-60 mb-8">
          Halaman ini tidak ada atau kamu salah jalan. Cek URL-nya atau balik ke beranda.
        </p>
        <Link href="/" className="nb-btn bg-primary text-lg px-8 py-3 inline-block">
          ← KEMBALI KE BERANDA
        </Link>
      </div>
    </div>
  );
}
