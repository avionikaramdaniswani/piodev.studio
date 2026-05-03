import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type UserRole = "user" | "staff" | "admin";
export type UserTier = "free" | "plus";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  tier: UserTier | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  tier: null,
  loading: true,
  signOut: async () => {},
});

async function fetchProfile(userId: string): Promise<{ role: UserRole; tier: UserTier }> {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("role, tier")
      .eq("id", userId)
      .single();
    return {
      role: (data?.role as UserRole) ?? "user",
      tier: (data?.tier as UserTier) ?? "free",
    };
  } catch {
    return { role: "user", tier: "free" };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [tier, setTier] = useState<UserTier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION immediately on mount in Supabase v2
    // so we don't need a separate getSession() call
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const { role: r, tier: t } = await fetchProfile(session.user.id);
        setRole(r);
        setTier(t);
      } else {
        setRole(null);
        setTier(null);
      }

      setLoading(false);
    });

    // Safety net: if Supabase never responds, stop showing loading after 4s
    const timeout = setTimeout(() => setLoading(false), 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setTier(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, tier, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
