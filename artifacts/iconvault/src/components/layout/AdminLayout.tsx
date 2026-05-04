import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Grid, Users, Upload, LogOut, Menu, X, Shield, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  adminOnly?: boolean;
  accent?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "DASHBOARD", icon: LayoutDashboard, exact: true, accent: "#FF6B35" },
  { href: "/admin/icons", label: "KELOLA IKON", icon: Grid, accent: "#FFE034" },
  { href: "/admin/users", label: "KELOLA PENGGUNA", icon: Users, adminOnly: true, accent: "#4DBBFF" },
  { href: "/upload", label: "UPLOAD IKON", icon: Upload, accent: "#00E676" },
];

function SidebarNav({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  const { user, role, signOut } = useAuth();

  const isActive = (href: string, exact?: boolean) =>
    exact ? location === href : location.startsWith(href) && href !== "/admin";
  const isDashActive = location === "/admin";

  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || role === "admin");
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b-[4px] border-foreground p-4 flex items-center justify-between">
        <Link href="/" onClick={onClose} className="flex items-center gap-2 group">
          <div className="border-[3px] border-foreground px-2 py-1 font-black text-sm group-hover:shadow-[2px_2px_0_#0A0A0A] transition-shadow">
            PioDev
          </div>
          <div className="flex items-center gap-1 opacity-60">
            <Shield className="w-3.5 h-3.5" />
            <span className="font-black text-xs">ADMIN</span>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="border-[2px] border-foreground p-1 hover:bg-secondary">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const active = item.exact ? isDashActive : isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 font-black text-sm border-[3px] transition-all ${
                active
                  ? "border-foreground shadow-[3px_3px_0_#0A0A0A]"
                  : "border-transparent hover:border-foreground hover:bg-secondary"
              }`}
              style={active ? { background: item.accent } : {}}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t-[4px] border-foreground p-3 flex flex-col gap-2">
        <div className="border-[3px] border-foreground p-3 flex items-center gap-3" style={{ background: "#FF6B35" }}>
          <div className="w-8 h-8 border-[2px] border-white flex items-center justify-center font-black text-xs text-white flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-black text-xs text-white truncate">{user?.email}</p>
            <p className="font-mono text-[10px] text-white opacity-80 uppercase">{role}</p>
          </div>
        </div>
        <button
          onClick={() => { onClose?.(); signOut(); }}
          className="w-full border-[3px] border-foreground px-3 py-2 font-black text-sm flex items-center gap-2 hover:bg-secondary transition-colors"
        >
          <LogOut className="w-4 h-4" /> KELUAR
        </button>
      </div>
    </div>
  );
}

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background font-sans text-foreground">
      <aside className="hidden lg:flex flex-col w-60 border-r-[4px] border-foreground sticky top-0 h-screen flex-shrink-0">
        <SidebarNav />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r-[4px] border-foreground z-10">
            <SidebarNav onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden border-b-[4px] border-foreground px-4 py-3 flex items-center gap-3 sticky top-0 bg-background z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="border-[3px] border-foreground p-1.5 hover:bg-secondary"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Shield className="w-5 h-5" />
          <span className="font-black text-base">{title ?? "PANEL ADMIN"}</span>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
