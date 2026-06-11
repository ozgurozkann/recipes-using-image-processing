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
    <main className="login-page">
      <div className="login-float login-float-one"><img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=260&h=260&fit=crop&auto=format" alt="" /></div>
      <div className="login-float login-float-two"><img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=260&h=260&fit=crop&auto=format" alt="" /></div>
      <section className="login-main">
        <div className="login-heading">
          <span>Lezzet Pusulası</span>
          <h1>Tekrar hoş geldin</h1>
          <p>Tariflerini, favorilerini ve kaydettiklerini kaldığın yerden yönet.</p>
        </div>
        <form className="login-card" onSubmit={submit}>
          {err && <div className="login-error">{err}</div>}
          <label className="login-field">
            <span>E-posta</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mail@ornek.com" required autoFocus />
          </label>
          <label className="login-field">
            <span>Şifre</span>
            <div className="login-password">
              <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              <button type="button" onClick={() => setShowPass((v) => !v)}>{showPass ? "Gizle" : "Göster"}</button>
            </div>
          </label>
          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? <><Spinner size="sm" /> Giriş yapılıyor</> : "Giriş Yap"}
          </button>
          <div className="login-register">Hesabın yok mu? <Link to="/register">Kayıt ol</Link></div>
          <div className="login-hint">
            Test: <code>admin@example.com</code> / <code>admin1234</code>
          </div>
        </form>
      </section>
    </main>
  );
}
