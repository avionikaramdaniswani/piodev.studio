import { Link, useLocation } from "wouter";
import { Menu, LogIn, User, Shield } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, role, loading } = useAuth();
  const [, navigate] = useLocation();

  const NavLinks = () => (
    <>
      <Link href="/" onClick={() => setOpen(false)} className="font-bold text-lg hover:underline underline-offset-4 decoration-4">BERANDA</Link>
      <Link href="/icons" onClick={() => setOpen(false)} className="font-bold text-lg hover:underline underline-offset-4 decoration-4">IKON</Link>
      <Link href="/tools" onClick={() => setOpen(false)} className="font-bold text-lg hover:underline underline-offset-4 decoration-4">TOOLS</Link>
    </>
  );

  // Single smart auth button — adapts to login state and role
  const SmartAuthButton = ({ size = "md" }: { size?: "sm" | "md" }) => {
    const px = size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1 text-sm";
    const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";
    if (loading) return null;

    if (!user) {
      return (
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className={`nb-btn ${px} font-black flex items-center gap-1`}
            style={{ background: "#FFE034" }}
          >
            <LogIn className={iconSize} /> MASUK
          </Link>
          {size === "md" && (
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className={`nb-btn ${px} font-black flex items-center gap-1`}
              style={{ background: "#FF6B9D", color: "white" }}
            >
              <User className={iconSize} /> DAFTAR
            </Link>
          )}
        </div>
      );
    }

    if (role === "admin" || role === "staff") {
      return (
        <Link
          href="/admin"
          onClick={() => setOpen(false)}
          className={`nb-btn ${px} font-black flex items-center gap-1`}
          style={{ background: "#FF6B35", color: "white" }}
        >
          <Shield className={iconSize} />
          {size === "sm" ? "ADMIN" : "PANEL ADMIN"}
        </Link>
      );
    }

    // Regular user → PROFIL button
    const initials = user.email?.slice(0, 2).toUpperCase() ?? "??";
    return (
      <Link
        href="/profil"
        onClick={() => setOpen(false)}
        className={`nb-btn ${px} font-black flex items-center gap-2`}
        style={{ background: "white" }}
      >
        <span
          className="w-5 h-5 rounded-none border-[2px] border-foreground flex items-center justify-center font-black text-[9px] shrink-0"
          style={{ background: "#4DBBFF" }}
        >
          {initials}
        </span>
        PROFIL
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-card border-b-[3px] border-foreground">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="flex flex-col shrink-0">
          <div className="relative">
            <div className="absolute inset-0 bg-primary translate-x-1 translate-y-1"></div>
            <span className="relative text-2xl font-black bg-card px-2 border-[3px] border-foreground">PioDev</span>
          </div>
          <span className="font-mono text-[10px] font-bold mt-1 tracking-widest text-foreground">piodev.studio</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <NavLinks />
          <div className="border-l-[3px] border-foreground pl-6">
            <SmartAuthButton size="md" />
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex items-center gap-2">
          <SmartAuthButton size="sm" />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="nb-btn px-3 py-2 bg-primary">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] border-l-[3px] border-foreground bg-secondary p-8 flex flex-col gap-6">
              <NavLinks />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
