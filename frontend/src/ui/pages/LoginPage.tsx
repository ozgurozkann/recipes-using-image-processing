import { useState } from "react";
import { api } from "../api";
import { setToken } from "../authStore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    try {
      const out = await api<{ access_token: string }>("POST", "/auth/login", { email, password });
      setToken(out.access_token);
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <div className="grid">
      <div className="card" style={{ gridColumn: "span 6" }}>
      <h2>Giriş</h2>
      <div className="muted">Hesabınla giriş yap.</div>
      {err && <div className="error" style={{ marginTop: 12 }}>{err}</div>}
      <div className="field">
        <label className="muted">E-posta</label>
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mail@ornek.com" />
      </div>
      <div className="field">
        <label className="muted">Şifre</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
      </div>
      <button className="btn primary" onClick={submit} style={{ marginTop: 12 }}>
        Giriş yap
      </button>
      </div>
      <div className="card" style={{ gridColumn: "span 6" }}>
        <h3>İpucu</h3>
        <div className="muted">
          Seed admin: <code>admin@example.com</code> / <code>admin1234</code>
        </div>
      </div>
    </div>
  );
}
