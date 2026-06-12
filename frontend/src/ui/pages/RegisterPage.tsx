import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { setToken } from "../authStore";
import { useLanguage } from "../i18n";

export default function RegisterPage() {
  const { t } = useLanguage();
  const [full_name, setFullName] = useState("");
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
      const out = await api<{ access_token: string }>("POST", "/auth/register", { full_name, email, password });
      setToken(out.access_token);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-grow flex items-center justify-center px-5 md:px-16 py-8" style={{ minHeight: "calc(100vh - 80px)" }}>
      <div className="glass-card ambient-shadow rounded-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-5xl min-h-[600px] animate-scale-in">

        {/* Visual Left */}
        <div className="hidden md:flex w-1/2 relative bg-surface-container-low overflow-hidden items-center justify-center p-8">
          <div className="relative z-10 w-full aspect-square max-w-md rounded-full overflow-hidden border-[12px] border-white/50 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=600&fit=crop"
              alt="Taze malzemeler"
              className="w-full h-full object-cover scale-110 hover:scale-100 transition-transform duration-1000 ease-out"
            />
          </div>
          <div className="absolute bottom-12 right-12 px-4 py-2 rounded-full shadow-lg border border-white/20 rotate-3"
            style={{ background: "rgba(255,219,208,0.9)", backdropFilter: "blur(12px)" }}>
            <span className="text-label-caps font-semibold text-on-secondary-container flex items-center gap-2">
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              {t("reg_chip")}
            </span>
          </div>
        </div>

        {/* Form Right */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <header className="mb-8">
              <h1 className="text-headline-md md:text-display-lg font-bold text-primary mb-2">
                {t("reg_title")}
              </h1>
              <p className="text-on-surface-variant text-body-md">
                {t("reg_subtitle")}
              </p>
            </header>

            {err && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {err}
              </div>
            )}

            <form className="space-y-6" onSubmit={submit}>
              {/* Full Name */}
              <div className="group">
                <label className="block text-label-caps text-on-surface-variant mb-1 ml-1 group-focus-within:text-primary transition-colors font-semibold uppercase tracking-wider text-xs">
                  {t("reg_name")}
                </label>
                <input
                  className="quiet-input"
                  type="text"
                  value={full_name}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("reg_name_ph")}
                  autoFocus
                />
              </div>

              {/* Email */}
              <div className="group">
                <label className="block text-label-caps text-on-surface-variant mb-1 ml-1 group-focus-within:text-primary transition-colors font-semibold uppercase tracking-wider text-xs">
                  {t("reg_email")}
                </label>
                <input
                  className="quiet-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="isim@ornek.com"
                  required
                />
              </div>

              {/* Password */}
              <div className="group relative">
                <label className="block text-label-caps text-on-surface-variant mb-1 ml-1 group-focus-within:text-primary transition-colors font-semibold uppercase tracking-wider text-xs">
                  {t("reg_password")}
                </label>
                <input
                  className="quiet-input pr-10"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
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
                  <><span className="spinner" /> {t("reg_loading")}</>
                ) : (
                  <>{t("reg_submit")} <span className="material-symbols-outlined text-xl">arrow_forward</span></>
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
                  {t("reg_divider")}
                </span>
              </div>
            </div>

            {/* Social Auth */}
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-3 border border-outline-variant/30 py-3 rounded-xl hover:bg-surface-container-low transition-colors active:scale-95 text-xs font-semibold">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                GOOGLE
              </button>
              <button className="flex items-center justify-center gap-3 border border-outline-variant/30 py-3 rounded-xl hover:bg-surface-container-low transition-colors active:scale-95 text-xs font-semibold">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.96 0-2.04-.6-3.23-.6-1.16 0-2.22.58-3.12.58-1.32 0-3.13-1.42-4.04-3.03-1.2-2.14-1.28-5.36.21-7.23.75-.95 1.76-1.53 2.77-1.53.94 0 1.77.53 2.45.53.64 0 1.63-.58 2.76-.58 1.06 0 2.27.53 3.01 1.58-2.67 1.41-2.24 5.17.41 6.55-.58 1.45-1.42 2.72-2.22 3.73zM12.03 7.25c-.23-1.6 1.05-3.13 2.49-3.25.26 1.75-1.4 3.25-2.49 3.25z"/>
                </svg>
                APPLE
              </button>
            </div>

            {/* Footer link */}
            <footer className="mt-8 text-center">
              <p className="text-on-surface-variant text-body-md">
                {t("reg_has_account")}{" "}
                <Link to="/login" className="text-primary font-bold hover:underline underline-offset-4 decoration-primary/30 ml-1 transition-all">
                  {t("reg_login_link")}
                </Link>
              </p>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
