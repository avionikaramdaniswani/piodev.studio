import { useState } from "react";
import { Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, UserPlus, Mail, CheckCircle } from "lucide-react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Password tidak cocok.");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        setError("Email sudah terdaftar. Silakan masuk.");
      } else {
        setError("Gagal membuat akun. Coba lagi.");
      }
      return;
    }

    // If session exists immediately = email confirmation is disabled, auto-logged-in
    if (data.session) {
      window.location.href = "/";
      return;
    }

    // Email confirmation required
    setRegistered(true);
  };

  if (registered) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="nb-card p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 border-[3px] border-foreground shadow-[4px_4px_0_#0A0A0A] mb-6" style={{ background: "#00E676" }}>
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="mb-4">
              <div className="relative inline-block mb-3">
                <div className="absolute inset-0 translate-x-1 translate-y-1" style={{ background: "#00E676" }} />
                <span className="relative font-black text-xl bg-card px-3 py-1 border-[3px] border-foreground block">
                  CEK EMAIL KAMU!
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mb-4 p-3 border-[3px] border-foreground" style={{ background: "#f5f5f5" }}>
              <Mail className="w-5 h-5 shrink-0" />
              <p className="font-mono text-sm font-bold">{email}</p>
            </div>
            <p className="font-mono text-sm opacity-60 mb-6">
              Kami kirimkan link verifikasi ke email kamu. Klik link tersebut untuk mengaktifkan akun, lalu masuk ke sini.
            </p>
            <Link
              href="/login"
              className="nb-btn w-full py-3 font-black text-base flex items-center justify-center gap-2"
              style={{ background: "#FFE034" }}
            >
              MASUK SEKARANG
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="nb-card p-8">
          <div className="mb-8">
            <div className="inline-block mb-4">
              <div className="relative">
                <div className="absolute inset-0 translate-x-1 translate-y-1" style={{ background: "#FF6B9D" }} />
                <span className="relative font-black text-3xl bg-card px-3 py-1 border-[3px] border-foreground block">
                  DAFTAR
                </span>
              </div>
            </div>
            <p className="font-mono text-sm opacity-60">Daftar di PioDev.studio — gratis selamanya</p>
          </div>

          {error && (
            <div className="nb-card mb-6 p-3 border-[3px]" style={{ borderColor: "#FF6B35", background: "#FFF3EF" }}>
              <p className="font-mono text-sm font-bold" style={{ color: "#FF6B35" }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            <div>
              <label className="block font-black text-sm mb-2">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="nb-input w-full px-4 py-3 text-base"
                placeholder="kamu@contoh.com"
                autoComplete="email"
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
                  placeholder="min. 6 karakter"
                  autoComplete="new-password"
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

            <div>
              <label className="block font-black text-sm mb-2">KONFIRMASI PASSWORD</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="nb-input w-full px-4 py-3 text-base"
                placeholder="ulangi password kamu"
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="nb-btn w-full py-3 font-black text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "#FF6B9D", color: "white" }}
            >
              <UserPlus className="w-5 h-5" />
              {loading ? "MEMBUAT AKUN..." : "BUAT AKUN"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t-[3px] border-foreground text-center">
            <p className="font-mono text-sm">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-black underline underline-offset-2 decoration-2">
                MASUK
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
