import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type UserRole = "user" | "staff" | "admin";
export type UserTier = "free" | "plus";

const FREE_QUOTA = 50;

type ProfileUpdateResult = { error: string | null };

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  tier: UserTier | null;
  username: string | null;
  downloadsToday: number;
  quotaLimit: number;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUsername: (username: string) => Promise<ProfileUpdateResult>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  tier: null,
  username: null,
  downloadsToday: 0,
  quotaLimit: FREE_QUOTA,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  updateUsername: async () => ({ error: null }),
});

interface ProfileData {
  role: UserRole;
  tier: UserTier;
  username: string | null;
  downloadsToday: number;
  quotaLimit: number;
}

async function fetchProfile(userId: string): Promise<ProfileData> {
  // Langkah 1: coba query lengkap dengan semua kolom
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role, tier, username, downloads_today, quota_reset_date")
      .eq("id", userId)
      .single();

    if (!error && data) {
      const tier: UserTier = (data.tier as UserTier) ?? "free";
      const today = new Date().toISOString().split("T")[0];
      const isToday = data.quota_reset_date === today;
      const downloadsToday = isToday ? (data.downloads_today ?? 0) : 0;
      return {
        role: (data.role as UserRole) ?? "user",
        tier,
        username: data.username ?? null,
        downloadsToday,
        quotaLimit: tier === "plus" ? -1 : FREE_QUOTA,
      };
    }

    // Langkah 2: kolom baru mungkin belum ada — coba query minimal (role + tier saja)
    const { data: minimal, error: minErr } = await supabase
      .from("profiles")
      .select("role, tier")
      .eq("id", userId)
      .single();

    if (!minErr && minimal) {
      const tier: UserTier = (minimal.tier as UserTier) ?? "free";
      return {
        role: (minimal.role as UserRole) ?? "user",
        tier,
        username: null,
        downloadsToday: 0,
        quotaLimit: tier === "plus" ? -1 : FREE_QUOTA,
      };
    }

    // Langkah 3: row belum ada sama sekali — buat dulu
    await supabase
      .from("profiles")
      .upsert({ id: userId, role: "user", tier: "free" }, { onConflict: "id" });

    return { role: "user", tier: "free", username: null, downloadsToday: 0, quotaLimit: FREE_QUOTA };
  } catch {
    return { role: "user", tier: "free", username: null, downloadsToday: 0, quotaLimit: FREE_QUOTA };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [tier, setTier] = useState<UserTier | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [downloadsToday, setDownloadsToday] = useState(0);
  const [quotaLimit, setQuotaLimit] = useState(FREE_QUOTA);
  const [loading, setLoading] = useState(true);

  const applyProfile = (p: ProfileData) => {
    setRole(p.role);
    setTier(p.tier);
    setUsername(p.username);
    setDownloadsToday(p.downloadsToday);
    setQuotaLimit(p.quotaLimit);
  };

  const refreshProfile = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;
    const profile = await fetchProfile(currentUser.id);
    applyProfile(profile);
  }, []);

  const updateUsername = useCallback(async (newUsername: string): Promise<ProfileUpdateResult> => {
    const cleanUsername = newUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

    if (!cleanUsername) return { error: "Nama pengguna tidak boleh kosong." };
    if (cleanUsername.length < 3) return { error: "Nama pengguna minimal 3 karakter." };

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return { error: "Tidak login" };

    const { error } = await supabase
      .from("profiles")
      .update({ username: cleanUsername })
      .eq("id", currentUser.id);

    if (error) {
      if (error.code === "23505") return { error: "Nama pengguna sudah dipakai, coba yang lain." };
      return { error: "Gagal menyimpan nama pengguna." };
    }

    setUsername(cleanUsername);
    return { error: null };
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        applyProfile(profile);
      } else {
        setRole(null);
        setTier(null);
        setUsername(null);
        setDownloadsToday(0);
        setQuotaLimit(FREE_QUOTA);
      }

      setLoading(false);
    });

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
    setUsername(null);
    setDownloadsToday(0);
    setQuotaLimit(FREE_QUOTA);
  };

  return (
    <AuthContext.Provider value={{
      user, session, role, tier, username,
      downloadsToday, quotaLimit, loading,
      signOut, refreshProfile, updateUsername,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
