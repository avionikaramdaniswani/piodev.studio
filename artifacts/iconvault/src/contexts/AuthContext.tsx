import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
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

async function fetchProfile(accessToken: string): Promise<ProfileData | null> {
  // Fetch profile via the API server instead of querying Supabase directly.
  // This avoids Supabase client RLS timing issues on page refresh where
  // auth.uid() may return null before the session is fully initialized,
  // causing the profile row to be hidden and role to fallback to "user".
  try {
    const res = await fetch("/api/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      if (res.status === 404) {
        // Genuine new user — profile not found, return safe defaults
        return { role: "user", tier: "free", username: null, downloadsToday: 0, quotaLimit: FREE_QUOTA };
      }
      if (res.status === 401) {
        // Token invalid — ghost session
        return null;
      }
      console.error("[AuthContext] fetchProfile API error:", res.status);
      return { role: "user", tier: "free", username: null, downloadsToday: 0, quotaLimit: FREE_QUOTA };
    }

    const data = await res.json() as {
      role: string;
      tier: string;
      username: string | null;
      downloadsToday: number;
      quotaResetDate: string | null;
    };

    const tier: UserTier = (data.tier as UserTier) ?? "free";
    const today = new Date().toISOString().split("T")[0];
    const isToday = data.quotaResetDate === today;
    const downloadsToday = isToday ? (data.downloadsToday ?? 0) : 0;

    return {
      role: (data.role as UserRole) ?? "user",
      tier,
      username: data.username ?? null,
      downloadsToday,
      quotaLimit: tier === "plus" ? -1 : FREE_QUOTA,
    };
  } catch (err) {
    console.error("[AuthContext] fetchProfile network error:", err);
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

  const mountedRef = useRef(true);

  const applyProfile = useCallback((p: ProfileData) => {
    setRole(p.role);
    setTier(p.tier);
    setUsername(p.username);
    setDownloadsToday(p.downloadsToday);
    setQuotaLimit(p.quotaLimit);
  }, []);

  const clearProfile = useCallback(() => {
    setRole(null);
    setTier(null);
    setUsername(null);
    setDownloadsToday(0);
    setQuotaLimit(FREE_QUOTA);
    setAuthTokenGetter(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (!s?.access_token) return;
    const profile = await fetchProfile(s.access_token);
    if (!mountedRef.current) return;
    if (profile !== null) applyProfile(profile);
  }, [applyProfile]);

  const updateUsername = useCallback(async (newUsername: string): Promise<ProfileUpdateResult> => {
    const cleanUsername = newUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!cleanUsername) return { error: "Nama pengguna tidak boleh kosong." };
    if (cleanUsername.length < 3) return { error: "Nama pengguna minimal 3 karakter." };

    const { data: { session: s } } = await supabase.auth.getSession();
    if (!s?.user) return { error: "Tidak login" };

    const { error } = await supabase
      .from("profiles")
      .update({ username: cleanUsername })
      .eq("id", s.user.id);

    if (error) {
      if (error.code === "23505") return { error: "Nama pengguna sudah dipakai, coba yang lain." };
      return { error: "Gagal menyimpan nama pengguna." };
    }

    setUsername(cleanUsername);
    return { error: null };
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Register JWT getter for protected API calls
    setAuthTokenGetter(async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      return s?.access_token ?? null;
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mountedRef.current) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Update JWT getter with latest session
          setAuthTokenGetter(async () => {
            const { data: { session: s } } = await supabase.auth.getSession();
            return s?.access_token ?? null;
          });

          const profile = await fetchProfile(newSession.access_token);
          if (!mountedRef.current) return;

          if (profile === null) {
            // Ghost session: account deleted from auth.users, FK violation on insert
            // Sign out safely outside the callback to avoid deadlock
            clearProfile();
            setUser(null);
            setSession(null);
            if (mountedRef.current) setLoading(false);
            setTimeout(() => supabase.auth.signOut().catch(() => {}), 0);
            return;
          }

          applyProfile(profile);
        } else {
          clearProfile();
        }

        if (mountedRef.current) setLoading(false);
      },
    );

    // Periodic server-side validation every 5 minutes to catch deleted accounts
    const validationInterval = setInterval(async () => {
      if (!mountedRef.current) return;
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!s) return;
      const { error } = await supabase.auth.getUser();
      if (error && mountedRef.current) {
        setTimeout(() => supabase.auth.signOut().catch(() => {}), 0);
      }
    }, 5 * 60 * 1000);

    // Also validate when user returns to the tab
    const onFocus = async () => {
      if (!mountedRef.current) return;
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!s) return;
      const { error } = await supabase.auth.getUser();
      if (error && mountedRef.current) {
        setTimeout(() => supabase.auth.signOut().catch(() => {}), 0);
      }
    };
    window.addEventListener("focus", onFocus);

    // Safety timeout — never leave app in loading state forever
    const timeout = setTimeout(() => {
      if (mountedRef.current) setLoading(false);
    }, 5000);

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      clearInterval(validationInterval);
      window.removeEventListener("focus", onFocus);
      clearTimeout(timeout);
    };
  }, [applyProfile, clearProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    clearProfile();
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
