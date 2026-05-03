import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { setAuthTokenGetter } from "@workspace/api-client-react";

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

async function fetchProfile(userId: string): Promise<ProfileData | null> {
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

    // Try minimal query if full query fails
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

    // Profile row doesn't exist — create it
    const { error: upsertErr } = await supabase
      .from("profiles")
      .upsert({ id: userId, role: "user", tier: "free" }, { onConflict: "id" });

    if (upsertErr) {
      // If we can't create a profile, the account may have been removed
      return null;
    }

    return { role: "user", tier: "free", username: null, downloadsToday: 0, quotaLimit: FREE_QUOTA };
  } catch {
    return null;
  }
}

const clearState = {
  user: null as User | null,
  session: null as Session | null,
  role: null as UserRole | null,
  tier: null as UserTier | null,
  username: null as string | null,
  downloadsToday: 0,
  quotaLimit: FREE_QUOTA,
};

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

  const clearAuth = useCallback(() => {
    setUser(clearState.user);
    setSession(clearState.session);
    setRole(clearState.role);
    setTier(clearState.tier);
    setUsername(clearState.username);
    setDownloadsToday(clearState.downloadsToday);
    setQuotaLimit(clearState.quotaLimit);
    setAuthTokenGetter(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    // Use getUser() (server-validated) instead of cached session
    const { data: { user: currentUser }, error } = await supabase.auth.getUser();
    if (error || !currentUser) {
      await supabase.auth.signOut();
      clearAuth();
      return;
    }
    const profile = await fetchProfile(currentUser.id);
    if (!profile) {
      // Profile couldn't be found or created — account likely deleted
      await supabase.auth.signOut();
      clearAuth();
      return;
    }
    applyProfile(profile);
  }, [clearAuth]);

  const updateUsername = useCallback(async (newUsername: string): Promise<ProfileUpdateResult> => {
    const cleanUsername = newUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

    if (!cleanUsername) return { error: "Nama pengguna tidak boleh kosong." };
    if (cleanUsername.length < 3) return { error: "Nama pengguna minimal 3 karakter." };

    const { data: { user: currentUser }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !currentUser) return { error: "Tidak login" };

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
    let mounted = true;

    // Register auth token getter so API calls include the Supabase JWT
    setAuthTokenGetter(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      // On sign out or token refresh failure → force clear
      if (event === "SIGNED_OUT") {
        clearAuth();
        setLoading(false);
        return;
      }

      // On initial load or sign in, validate server-side with getUser()
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (!newSession?.user) {
          clearAuth();
          setLoading(false);
          return;
        }

        // Server-side validation — if user was deleted this will fail
        const { data: { user: serverUser }, error: userErr } = await supabase.auth.getUser();

        if (!mounted) return;

        if (userErr || !serverUser) {
          // Account no longer exists on Supabase — force sign out
          await supabase.auth.signOut();
          clearAuth();
          setLoading(false);
          return;
        }

        setSession(newSession);
        setUser(serverUser);

        // Re-register token getter with fresh session
        setAuthTokenGetter(async () => {
          const { data: { session: s } } = await supabase.auth.getSession();
          return s?.access_token ?? null;
        });

        const profile = await fetchProfile(serverUser.id);
        if (!mounted) return;

        if (!profile) {
          // Profile missing even after attempted creation — account inconsistent, sign out
          await supabase.auth.signOut();
          clearAuth();
          setLoading(false);
          return;
        }

        applyProfile(profile);
        setLoading(false);
        return;
      }

      // USER_UPDATED or other events — update session state only
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (!newSession?.user) clearAuth();
      setLoading(false);
    });

    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 5000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [clearAuth]);

  const signOut = async () => {
    await supabase.auth.signOut();
    clearAuth();
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
