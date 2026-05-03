import { Link, useLocation } from "wouter";
import { Menu, LogIn, LogOut, User, Shield } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, role, loading, signOut } = useAuth();
  const [, navigate] = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setOpen(false);
  };

  const AuthButtons = ({ mobile = false }: { mobile?: boolean }) => {
    if (loading) return null;
    if (user) {
      return (
        <div className={`flex ${mobile ? "flex-col" : "flex-row"} items-start md:items-center gap-3`}>
          <div className="flex flex-col items-start">
            <span className="font-mono text-xs opacity-50 truncate max-w-[160px]" title={user.email}>
              {user.email}
            </span>
            {role && role !== "user" && (
              <span
                className="font-mono text-[10px] font-black px-1 border-[2px] border-foreground"
                style={{
                  background: role === "admin" ? "#FF6B35" : role === "staff" ? "#4DBBFF" : "transparent",
                  color: role === "admin" || role === "staff" ? "white" : "inherit",
                }}
              >
                {role.toUpperCase()}
              </span>
            )}
          </div>
          {(role === "admin" || role === "staff") && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="nb-btn px-3 py-1 text-sm font-black flex items-center gap-1"
              style={{ background: "#4DBBFF" }}
            >
              <Shield className="w-4 h-4" /> ADMIN
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="nb-btn px-3 py-1 text-sm font-black flex items-center gap-1"
            style={{ background: "#FF6B35", color: "white" }}
          >
            <LogOut className="w-4 h-4" /> SIGN OUT
          </button>
        </div>
      );
    }
    return (
      <div className={`flex ${mobile ? "flex-col" : "flex-row"} items-start md:items-center gap-3`}>
        <Link
          href="/login"
          onClick={() => setOpen(false)}
          className="nb-btn px-4 py-1 text-sm font-black flex items-center gap-1"
          style={{ background: "white" }}
        >
          <LogIn className="w-4 h-4" /> LOGIN
        </Link>
        <Link
          href="/register"
          onClick={() => setOpen(false)}
          className="nb-btn px-4 py-1 text-sm font-black flex items-center gap-1"
          style={{ background: "#FF6B9D", color: "white" }}
        >
          <User className="w-4 h-4" /> REGISTER
        </Link>
      </div>
    );
  };

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <Link href="/" onClick={() => setOpen(false)} className="font-bold text-lg hover:underline underline-offset-4 decoration-4">HOME</Link>
      <Link href="/icons" onClick={() => setOpen(false)} className="font-bold text-lg hover:underline underline-offset-4 decoration-4">ICONS</Link>
      <Link href="/tools" onClick={() => setOpen(false)} className="font-bold text-lg hover:underline underline-offset-4 decoration-4">TOOLS</Link>
      {mobile && <div className="border-t-[3px] border-foreground pt-4 w-full"><AuthButtons mobile /></div>}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 w-full bg-card border-b-[3px] border-foreground">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex flex-col shrink-0">
          <div className="relative">
            <div className="absolute inset-0 bg-primary translate-x-1 translate-y-1"></div>
            <span className="relative text-2xl font-black bg-card px-2 border-[3px] border-foreground">IconVault</span>
          </div>
          <span className="font-mono text-[10px] font-bold mt-1 tracking-widest text-foreground">piodev.studio</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <NavLinks />
          <div className="border-l-[3px] border-foreground pl-6">
            <AuthButtons />
          </div>
        </div>

        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="nb-btn px-3 py-2 bg-primary">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] border-l-[3px] border-foreground sm:w-[400px] bg-secondary p-8 flex flex-col gap-6">
              <NavLinks mobile />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
