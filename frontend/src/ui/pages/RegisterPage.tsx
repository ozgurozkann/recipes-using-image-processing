import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { setToken } from "../authStore";
import Spinner from "../components/Spinner";

const BENEFITS = ["Tarifleri favorileyebilirsin", "Kendi tarifini ekleyebilirsin", "Fotoğrafla öneri alabilirsin"];

export default function RegisterPage() {
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

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Zayıf", "Orta", "Güçlü"];
  const strengthColor = ["", "var(--danger)", "var(--warning)", "var(--ok)"];

  return (
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 0" }}>
      <div style={{ width: "100%", maxWidth: 860, animation: "scaleIn 0.4s var(--transition-bounce) both" }}>

        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 20, margin: 0 }}>
          {/* Form */}
          <div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 12, animation: "heroFloat 4s ease-in-out infinite", display: "inline-block" }}>🍽️</div>
              <h1 className="page-title">Hesap Oluştur</h1>
              <p className="page-sub">Ücretsiz kayıt ol, hemen başla</p>
            </div>

            <div className="card card-flat" style={{ padding: 28 }}>
              {err && (
                <div className="error" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>⚠</span> {err}
                </div>
              )}

              <form onSubmit={submit}>
                <div className="field" style={{ marginTop: 0 }}>
                  <label className="label">Ad Soyad</label>
                  <input className="input" value={full_name} onChange={(e) => setFullName(e.target.value)}
                    placeholder="Adınız Soyadınız" autoFocus />
                </div>

                <div className="field">
                  <label className="label">E-posta</label>
                  <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="mail@ornek.com" required />
                </div>

                <div className="field">
                  <label className="label">Şifre</label>
                  <div style={{ position: "relative" }}>
                    <input className="input" type={showPass ? "text" : "password"} value={password}
                      onChange={(e) => setPassword(e.target.value)} placeholder="en az 6 karakter"
                      required minLength={6} style={{ paddingRight: 44 }} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                        background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 16 }}>
                      {showPass ? "🙈" : "👁"}
                    </button>
                  </div>
                  {password && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        {[1, 2, 3].map((i) => (
                          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2,
                            background: i <= strength ? strengthColor[strength] : "var(--border)",
                            transition: "background 0.3s ease" }} />
                        ))}
                      </div>
                      <div style={{ fontSize: 12, color: strengthColor[strength], marginTop: 4 }}>
                        {strengthLabel[strength]}
                      </div>
                    </div>
                  )}
                </div>

                <button type="submit" className="btn primary btn-lg" disabled={loading}
                  style={{ width: "100%", marginTop: 24, justifyContent: "center" }}>
                  {loading ? <><Spinner size="sm" /> Kayıt yapılıyor…</> : "Kayıt Ol →"}
                </button>
              </form>

              <div style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: "var(--muted)" }}>
                Hesabın var mı?{" "}
                <Link to="/login" style={{ color: "var(--primary-light)", fontWeight: 600 }}>Giriş yap</Link>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
            <div className="card" style={{ background: "linear-gradient(135deg, var(--primary-subtle), var(--ok-subtle))", borderColor: "rgba(124,92,255,0.25)" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Neden Üye Olmalısın?</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                {BENEFITS.map((b, i) => (
                  <div key={b} style={{ display: "flex", gap: 10, alignItems: "center",
                    animation: `fadeUp 0.4s ${i * 0.1 + 0.2}s ease both` }}>
                    <span style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--ok-subtle)",
                      border: "1px solid rgba(45,212,191,0.4)", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 12, color: "var(--ok)", flexShrink: 0 }}>
                      ✓
                    </span>
                    <span style={{ fontSize: 14, color: "var(--muted)" }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>🔒</div>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
                Bilgilerin güvende. Şifren bcrypt ile şifrelenir, JWT token ile güvenli oturum yönetimi yapılır.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
