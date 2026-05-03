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

async function fetchProfile(userId: string): Promise<ProfileData | null> {
  // Always get a fresh session first. This ensures the Supabase client's internal
  // auth state is up-to-date (including token refresh if expired) before we query.
  // Without this, on page refresh the RLS policy auth.uid() may return null,
  // hiding the row and causing a false PGRST116 "not found" → wrong role fallback.
  const { data: { session } } = await supabase.auth.getSession();

  // If there's no session at all, return safe defaults immediately
  if (!session) {
    return { role: "user", tier: "free", username: null, downloadsToday: 0, quotaLimit: FREE_QUOTA };
  }

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

  // PGRST116 = row not found. Since we verified a valid session exists above,
  // this genuinely means no profile row — new user. Insert a fresh one.
  if (error?.code === "PGRST116") {
    const { error: insertErr } = await supabase
      .from("profiles")
      .insert({ id: userId, role: "user", tier: "free" });

    if (insertErr) {
      // FK violation (23503) = account deleted from auth.users — ghost session
      if (insertErr.code === "23503") return null;
      // Any other insert error — fall through to safe defaults
    }

    return { role: "user", tier: "free", username: null, downloadsToday: 0, quotaLimit: FREE_QUOTA };
  }

  // Any other error — log it and return safe defaults without signing out
  console.error("[AuthContext] fetchProfile unexpected error:", error?.code, error?.message);
  return { role: "user", tier: "free", username: null, downloadsToday: 0, quotaLimit: FREE_QUOTA };
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
    if (!s?.user) return;
    const profile = await fetchProfile(s.user.id);
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

          const profile = await fetchProfile(newSession.user.id);
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
