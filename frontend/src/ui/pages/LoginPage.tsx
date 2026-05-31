import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { setToken } from "../authStore";
import Spinner from "../components/Spinner";

export default function LoginPage() {
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
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 0" }}>
      <div style={{ width: "100%", maxWidth: 460, animation: "scaleIn 0.4s var(--transition-bounce) both" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12, animation: "heroFloat 4s ease-in-out infinite", display: "inline-block" }}>👨‍🍳</div>
          <h1 className="page-title">Tekrar hoş geldin!</h1>
          <p className="page-sub">Hesabına giriş yap ve tarifleri keşfet</p>
        </div>

        <div className="card card-flat" style={{ padding: 32 }}>
          {err && (
            <div className="error" style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <span>⚠</span> {err}
            </div>
          )}

          <form onSubmit={submit}>
            <div className="field" style={{ marginTop: 0 }}>
              <label className="label">E-posta</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mail@ornek.com"
                required
                autoFocus
              />
            </div>

            <div className="field">
              <label className="label">Şifre</label>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 16 }}
                >
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn primary btn-lg"
              disabled={loading}
              style={{ width: "100%", marginTop: 24, justifyContent: "center" }}
            >
              {loading ? <><Spinner size="sm" /> Giriş yapılıyor…</> : "Giriş Yap →"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--muted)" }}>
            Hesabın yok mu?{" "}
            <Link to="/register" style={{ color: "var(--primary-light)", fontWeight: 600 }}>
              Kayıt ol
            </Link>
          </div>
        </div>

        {/* Hint card */}
        <div className="card" style={{ marginTop: 14, padding: 16, background: "var(--primary-subtle)", borderColor: "rgba(124,92,255,0.25)" }}>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            <strong style={{ color: "var(--primary-light)" }}>İpucu:</strong> Test için seed admin{" "}
            <code style={{ background: "var(--panel2)", padding: "1px 6px", borderRadius: 4 }}>admin@example.com</code>
            {" "}/ {" "}
            <code style={{ background: "var(--panel2)", padding: "1px 6px", borderRadius: 4 }}>admin1234</code>
          </div>
        </div>
      </div>
    </div>
  );
}
