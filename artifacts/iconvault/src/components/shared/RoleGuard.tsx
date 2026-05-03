import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { Lock } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  fallback?: React.ReactNode;
}

const ROLE_RANK: Record<UserRole, number> = {
  user: 1,
  staff: 2,
  admin: 3,
};

export function RoleGuard({ children, requiredRole, fallback }: RoleGuardProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="nb-card p-8 text-center animate-pulse">
          <p className="font-black text-xl">MEMUAT...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return fallback ?? (
      <div className="flex items-center justify-center py-24">
        <div className="nb-card p-10 text-center max-w-sm" style={{ background: "#FFE034" }}>
          <Lock className="w-12 h-12 mx-auto mb-4" />
          <h2 className="font-black text-2xl mb-2">PERLU LOGIN</h2>
          <p className="font-mono text-sm mb-6">Kamu harus masuk untuk mengakses halaman ini.</p>
          <Link href="/login" className="nb-btn px-6 py-2 font-black" style={{ background: "white" }}>
            MASUK
          </Link>
        </div>
      </div>
    );
  }

  const userRank = ROLE_RANK[role ?? "user"];
  const requiredRank = ROLE_RANK[requiredRole];

  if (userRank < requiredRank) {
    return fallback ?? (
      <div className="flex items-center justify-center py-24">
        <div className="nb-card p-10 text-center max-w-sm" style={{ background: "#FF6B35" }}>
          <Lock className="w-12 h-12 mx-auto mb-4 text-white" />
          <h2 className="font-black text-2xl mb-2 text-white">AKSES DITOLAK</h2>
          <p className="font-mono text-sm mb-2 text-white opacity-80">
            Area ini membutuhkan akses <strong>{requiredRole.toUpperCase()}</strong>.
          </p>
          <p className="font-mono text-sm text-white opacity-60">Peran kamu: {(role ?? "user").toUpperCase()}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
