import { Link, useLocation } from "wouter";
import { Menu, LogIn, User, Shield, Home, Grid, Wrench, LogOut, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { TierBadge } from "@/components/shared/TierBadge";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, role, tier, loading, signOut } = useAuth();
  const [, navigate] = useLocation();
  const [loc] = useLocation();

  const close = () => setOpen(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    close();
  };

  const NAV = [
    { href: "/", label: "BERANDA", icon: <Home className="w-4 h-4" /> },
    { href: "/icons", label: "IKON", icon: <Grid className="w-4 h-4" /> },
    { href: "/tools", label: "TOOLS", icon: <Wrench className="w-4 h-4" /> },
  ];

  const isActive = (href: string) =>
    href === "/" ? loc === "/" : loc.startsWith(href);

  // ── Desktop nav links ─────────────────────────────────────
  const DesktopLinks = () => (
    <>
      {NAV.map(n => (
        <Link
          key={n.href}
          href={n.href}
          className={`font-bold text-lg hover:underline underline-offset-4 decoration-4 ${isActive(n.href) ? "underline" : ""}`}
        >
          {n.label}
        </Link>
      ))}
    </>
  );

  // ── Smart auth button (desktop + small mobile) ────────────
  const SmartAuthButton = ({ size = "md" }: { size?: "sm" | "md" }) => {
    const px = size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1 text-sm";
    const iconSz = size === "sm" ? "w-3 h-3" : "w-4 h-4";
    if (loading) return null;

    if (!user) {
      return (
        <div className="flex items-center gap-2">
          <Link href="/login" className={`nb-btn ${px} font-black flex items-center gap-1`} style={{ background: "#FFE034" }}>
            <LogIn className={iconSz} /> MASUK
          </Link>
          {size === "md" && (
            <Link href="/register" className={`nb-btn ${px} font-black flex items-center gap-1`} style={{ background: "#FF6B9D", color: "white" }}>
              <User className={iconSz} /> DAFTAR
            </Link>
          )}
        </div>
      );
    }

    if (role === "admin" || role === "staff") {
      return (
        <Link href="/admin" className={`nb-btn ${px} font-black flex items-center gap-1`} style={{ background: "#FF6B35", color: "white" }}>
          <Shield className={iconSz} />
          {size === "sm" ? "ADMIN" : "PANEL ADMIN"}
        </Link>
      );
    }

    const initials = user.email?.slice(0, 2).toUpperCase() ?? "??";
    return (
      <Link href="/profil" className={`nb-btn ${px} font-black flex items-center gap-2`} style={{ background: "#4DBBFF" }}>
        <span className="w-5 h-5 border-[2px] border-foreground flex items-center justify-center font-black text-[9px] shrink-0" style={{ background: "white" }}>
          {initials}
        </span>
        PROFIL
      </Link>
    );
  };

  // ── Mobile Sidebar ────────────────────────────────────────
  const MobileSidebar = () => {
    const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??";
    const ROLE_COLORS: Record<string, string> = { admin: "#FF6B35", staff: "#4DBBFF", user: "#00E676" };
    const roleColor = ROLE_COLORS[role ?? "user"];

    return (
      <div className="flex flex-col h-full">
        {/* Sidebar header */}
        <div className="border-b-[3px] border-foreground pb-5 mb-5">
          <div className="flex items-start justify-between mb-4">
            <Link href="/" onClick={close} className="flex flex-col">
              <div className="relative">
                <div className="absolute inset-0 bg-primary translate-x-0.5 translate-y-0.5" />
                <span className="relative text-xl font-black bg-card px-2 border-[3px] border-foreground">PioDev</span>
              </div>
              <span className="font-mono text-[9px] font-bold mt-1 tracking-widest">piodev.studio</span>
            </Link>
            <SheetClose asChild>
              <button className="nb-btn p-2 border-[3px] border-foreground shadow-[2px_2px_0_#0A0A0A]" style={{ background: "#FFE034" }}>
                <X className="w-4 h-4" />
              </button>
            </SheetClose>
          </div>

          {/* User card — shown when logged in */}
          {user ? (
            <div className="border-[3px] border-foreground p-3" style={{ background: "#f5f5f5" }}>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 border-[2px] border-foreground shadow-[2px_2px_0_#0A0A0A] flex items-center justify-center font-black text-sm shrink-0"
                  style={{ background: "#4DBBFF" }}
                >
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] opacity-50 truncate">{user.email}</p>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span
                      className="font-mono text-[9px] font-black px-1.5 py-0.5 border-[1.5px] border-foreground uppercase"
                      style={{ background: roleColor, color: role === "user" ? "#0A0A0A" : "white" }}
                    >
                      {role}
                    </span>
                    <TierBadge tier={tier} size="xs" />
                  </div>
                </div>
              </div>
              {tier === "free" && (
                <div className="border-[2px] border-foreground p-2 flex items-center gap-2 cursor-pointer hover:opacity-80" style={{ background: "#FFE034" }}>
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <p className="font-black text-[10px]">UPGRADE KE PLUS</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link href="/login" onClick={close} className="nb-btn py-2 font-black text-sm flex items-center justify-center gap-2" style={{ background: "#FFE034" }}>
                <LogIn className="w-4 h-4" /> MASUK
              </Link>
              <Link href="/register" onClick={close} className="nb-btn py-2 font-black text-sm flex items-center justify-center gap-2" style={{ background: "#FF6B9D", color: "white" }}>
                <User className="w-4 h-4" /> DAFTAR GRATIS
              </Link>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              onClick={close}
              className={`flex items-center gap-3 px-3 py-3 font-black border-[2px] transition-all ${
                isActive(n.href)
                  ? "border-foreground shadow-[2px_2px_0_#0A0A0A]"
                  : "border-transparent hover:border-foreground hover:bg-secondary"
              }`}
              style={isActive(n.href) ? { background: "#FFE034" } : {}}
            >
              {n.icon}
              {n.label}
            </Link>
          ))}

          {(role === "admin" || role === "staff") && (
            <Link
              href="/admin"
              onClick={close}
              className="flex items-center gap-3 px-3 py-3 font-black border-[2px] border-transparent hover:border-foreground hover:bg-secondary transition-all"
            >
              <Shield className="w-4 h-4" /> PANEL ADMIN
            </Link>
          )}

          {user && role === "user" && (
            <Link
              href="/profil"
              onClick={close}
              className={`flex items-center gap-3 px-3 py-3 font-black border-[2px] transition-all ${
                isActive("/profil") ? "border-foreground shadow-[2px_2px_0_#0A0A0A]" : "border-transparent hover:border-foreground hover:bg-secondary"
              }`}
              style={isActive("/profil") ? { background: "#4DBBFF" } : {}}
            >
              <User className="w-4 h-4" /> PROFIL
            </Link>
          )}
        </nav>

        {/* Sign out at bottom */}
        {user && (
          <div className="border-t-[3px] border-foreground pt-4 mt-4">
            <button
              onClick={handleSignOut}
              className="nb-btn w-full py-2.5 font-black text-sm flex items-center justify-center gap-2"
              style={{ background: "#FF6B35", color: "white" }}
            >
              <LogOut className="w-4 h-4" /> KELUAR
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-card border-b-[3px] border-foreground">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="flex flex-col shrink-0">
          <div className="relative">
            <div className="absolute inset-0 bg-primary translate-x-1 translate-y-1" />
            <span className="relative text-2xl font-black bg-card px-2 border-[3px] border-foreground">PioDev</span>
          </div>
          <span className="font-mono text-[10px] font-bold mt-1 tracking-widest">piodev.studio</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <DesktopLinks />
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
            <SheetContent side="right" className="w-[300px] border-l-[3px] border-foreground bg-card p-6">
              <MobileSidebar />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
