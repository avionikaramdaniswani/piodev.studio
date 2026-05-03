import { useState } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="nb-card p-8">
          <div className="mb-8">
            <div className="inline-block mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary translate-x-1 translate-y-1" />
                <span className="relative font-black text-3xl bg-card px-3 py-1 border-[3px] border-foreground block">
                  SIGN IN
                </span>
              </div>
            </div>
            <p className="font-mono text-sm opacity-60">Welcome back to IconVault</p>
          </div>

          {error && (
            <div className="nb-card mb-6 p-3 border-[3px]" style={{ borderColor: "#FF6B35", background: "#FFF3EF" }}>
              <p className="font-mono text-sm font-bold" style={{ color: "#FF6B35" }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="block font-black text-sm mb-2">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="nb-input w-full px-4 py-3 text-base"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block font-black text-sm mb-2">PASSWORD</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="nb-input w-full px-4 py-3 pr-12 text-base"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="nb-btn w-full py-3 font-black text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "#FFE034" }}
            >
              <LogIn className="w-5 h-5" />
              {loading ? "SIGNING IN..." : "SIGN IN"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t-[3px] border-foreground text-center">
            <p className="font-mono text-sm">
              Don't have an account?{" "}
              <Link href="/register" className="font-black underline underline-offset-2 decoration-2">
                REGISTER
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
