import { Link } from "wouter";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const [open, setOpen] = useState(false);

  const NavLinks = () => (
    <>
      <Link href="/" className="font-bold text-lg hover:underline underline-offset-4 decoration-4">HOME</Link>
      <Link href="/icons" className="font-bold text-lg hover:underline underline-offset-4 decoration-4">ICONS</Link>
      <Link href="/tools" className="font-bold text-lg hover:underline underline-offset-4 decoration-4">TOOLS</Link>
      <Link href="/upload" className="font-bold text-lg hover:underline underline-offset-4 decoration-4 text-primary bg-foreground px-4 py-1 border-[3px] border-foreground">UPLOAD</Link>
    </>
  );

  return (
    <nav className="sticky top-0 z-50 w-full bg-card border-b-[3px] border-foreground">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex flex-col">
          <div className="relative">
            <div className="absolute inset-0 bg-primary translate-x-1 translate-y-1"></div>
            <span className="relative text-2xl font-black bg-card px-2 border-[3px] border-foreground">IconVault</span>
          </div>
          <span className="font-mono text-[10px] font-bold mt-1 tracking-widest text-foreground">piodev.studio</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <NavLinks />
        </div>

        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="nb-btn px-3 py-2 bg-primary">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] border-l-[3px] border-foreground sm:w-[400px] bg-secondary p-8 flex flex-col gap-6">
              <NavLinks />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
