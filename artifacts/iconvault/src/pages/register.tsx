import { useState } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, UserPlus } from "lucide-react";

export default function Register() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError("Gagal membuat akun. Coba lagi.");
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="nb-card p-8 text-center" style={{ background: "#FFE034" }}>
            <div className="text-5xl mb-4">✓</div>
            <h2 className="font-black text-2xl mb-2">CEK EMAIL KAMU!</h2>
            <p className="font-mono text-sm mb-6">
              Kami kirim link konfirmasi ke <strong>{email}</strong>. Klik link tersebut untuk mengaktifkan akun kamu.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="nb-btn px-6 py-2"
              style={{ background: "white" }}
            >
              KE HALAMAN MASUK
            </button>
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
