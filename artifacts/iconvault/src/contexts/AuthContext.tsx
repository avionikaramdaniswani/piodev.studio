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

// Returns null when the auth account no longer exists (FK violation)
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

    // Try minimal query
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

    // Row doesn't exist — attempt to create it
    const { error: upsertErr } = await supabase
      .from("profiles")
      .upsert({ id: userId, role: "user", tier: "free" }, { onConflict: "id" });

    if (upsertErr) {
      // FK violation (23503) = user was deleted from auth.users — ghost session
      if (upsertErr.code === "23503") return null;
    }

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

  // Safe sign-out: deferred so it never runs inside onAuthStateChange callback
  const safeSignOut = useCallback(() => {
    setTimeout(() => {
      supabase.auth.signOut().catch(() => {});
    }, 0);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;
    const profile = await fetchProfile(currentUser.id);
    if (!mountedRef.current) return;
    if (profile === null) {
      safeSignOut();
      return;
    }
    applyProfile(profile);
  }, [applyProfile, safeSignOut]);

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
    mountedRef.current = true;

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
          // Validate server-side that the auth account still exists
          // getUser() is safe to call here (read-only, no deadlock risk)
          const { error: userErr } = await supabase.auth.getUser();

          if (!mountedRef.current) return;

          if (userErr) {
            // JWT rejected by server — account deleted or token invalid
            // Use safeSignOut (deferred) to avoid calling signOut inside the callback
            clearProfile();
            setUser(null);
            setSession(null);
            if (mountedRef.current) setLoading(false);
            safeSignOut();
            return;
          }

          setAuthTokenGetter(async () => {
            const { data: { session: s } } = await supabase.auth.getSession();
            return s?.access_token ?? null;
          });

          const profile = await fetchProfile(newSession.user.id);
          if (!mountedRef.current) return;

          if (profile === null) {
            // Profile creation failed with FK violation = account deleted from auth.users
            clearProfile();
            setUser(null);
            setSession(null);
            if (mountedRef.current) setLoading(false);
            safeSignOut();
            return;
          }

          applyProfile(profile);
        } else {
          clearProfile();
        }

        if (mountedRef.current) setLoading(false);
      },
    );

    // Periodic server-side validation every 5 minutes
    const validationInterval = setInterval(async () => {
      if (!mountedRef.current) return;
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) return;

      const { error } = await supabase.auth.getUser();
      if (error && mountedRef.current) safeSignOut();
    }, 5 * 60 * 1000);

    // Validate on window focus
    const onFocus = async () => {
      if (!mountedRef.current) return;
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) return;

      const { error } = await supabase.auth.getUser();
      if (error && mountedRef.current) safeSignOut();
    };
    window.addEventListener("focus", onFocus);

    const timeout = setTimeout(() => {
      if (mountedRef.current) setLoading(false);
    }, 4000);

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      clearInterval(validationInterval);
      window.removeEventListener("focus", onFocus);
      clearTimeout(timeout);
    };
  }, [applyProfile, clearProfile, safeSignOut]);

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
