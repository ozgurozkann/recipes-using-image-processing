import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { setToken } from "../authStore";
import { useLanguage } from "../i18n";

export default function LoginPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const out = await api<{ access_token: string }>("POST", "/auth/login", { email, password });
      setToken(out.access_token);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-grow flex items-center justify-center px-5 md:px-16 py-8" style={{ minHeight: "calc(100vh - 80px)" }}>
      {/* Card */}
      <div className="glass-card ambient-shadow rounded-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-5xl min-h-[600px] animate-scale-in">

        {/* Visual Left */}
        <div className="hidden md:flex w-1/2 relative bg-surface-container-low overflow-hidden items-center justify-center p-8">
          <div className="relative z-10 w-full aspect-square max-w-md rounded-full overflow-hidden border-[12px] border-white/50 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=600&fit=crop"
              alt="Gurme yemek"
              className="w-full h-full object-cover scale-110 hover:scale-100 transition-transform duration-1000 ease-out"
            />
          </div>
          {/* Floating chip */}
          <div className="absolute bottom-12 right-12 px-4 py-2 rounded-full shadow-lg border border-white/20 rotate-3"
            style={{ background: "rgba(255,219,208,0.9)", backdropFilter: "blur(12px)" }}>
            <span className="text-label-caps font-semibold text-on-secondary-container flex items-center gap-2">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              {t("login_chip")}
            </span>
          </div>
        </div>

        {/* Form Right */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <header className="mb-8">
              <h1 className="text-headline-md md:text-display-lg font-bold text-primary mb-2">
                {t("login_welcome")}
              </h1>
              <p className="text-on-surface-variant text-body-md">
                {t("login_subtitle")}
              </p>
            </header>

            {err && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {err}
              </div>
            )}

            <form className="space-y-6" onSubmit={submit}>
              {/* Email */}
              <div className="group">
                <label className="block text-label-caps text-on-surface-variant mb-1 ml-1 group-focus-within:text-primary transition-colors font-semibold uppercase tracking-wider text-xs">
                  {t("login_email")}
                </label>
                <input
                  className="quiet-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="isim@ornek.com"
                  required
                  autoFocus
                />
              </div>

              {/* Password */}
              <div className="group relative">
                <label className="block text-label-caps text-on-surface-variant mb-1 ml-1 group-focus-within:text-primary transition-colors font-semibold uppercase tracking-wider text-xs">
                  {t("login_password")}
                </label>
                <input
                  className="quiet-input pr-10"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-0 bottom-3 text-on-surface-variant/50 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPass ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-4 rounded-xl font-semibold text-body-md shadow-lg shadow-primary/20 hover:bg-primary-container active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <><span className="spinner" /> {t("login_loading")}</>
                ) : (
                  <>{t("login_submit")} <span className="material-symbols-outlined text-xl">arrow_forward</span></>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/30" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-on-surface-variant/60 font-semibold uppercase tracking-widest text-xs bg-transparent">
                  {t("login_divider")}
                </span>
              </div>
            </div>

            {/* Test hint */}
            <div className="bg-surface-container rounded-xl p-4 text-xs text-on-surface-variant font-mono space-y-1">
              <div>{t("login_email_label")} <strong className="text-primary">admin@example.com</strong></div>
              <div>{t("login_pass_label")} <strong className="text-primary">admin1234</strong></div>
            </div>

            {/* Footer link */}
            <footer className="mt-8 text-center">
              <p className="text-on-surface-variant text-body-md">
                {t("login_no_account")}{" "}
                <Link to="/register" className="text-primary font-bold hover:underline underline-offset-4 decoration-primary/30 ml-1 transition-all">
                  {t("login_register_link")}
                </Link>
              </p>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
