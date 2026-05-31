import { useState } from "react";
import { api } from "../api";
import { setToken } from "../authStore";

export default function RegisterPage() {
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    try {
      const out = await api<{ access_token: string }>("POST", "/auth/register", { full_name, email, password });
      setToken(out.access_token);
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <div className="grid">
      <div className="card" style={{ gridColumn: "span 6" }}>
      <h2>Kayıt</h2>
      <div className="muted">Yeni hesap oluştur.</div>
      {err && <div className="error" style={{ marginTop: 12 }}>{err}</div>}
      <div className="field">
        <label className="muted">Ad Soyad</label>
        <input className="input" value={full_name} onChange={(e) => setFullName(e.target.value)} placeholder="Ad Soyad" />
      </div>
      <div className="field">
        <label className="muted">E-posta</label>
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mail@ornek.com" />
      </div>
      <div className="field">
        <label className="muted">Şifre</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="en az 6 karakter" />
      </div>
      <button className="btn primary" onClick={submit} style={{ marginTop: 12 }}>
        Kayıt ol
      </button>
      </div>
      <div className="card" style={{ gridColumn: "span 6" }}>
        <h3>Sonra ne olacak?</h3>
        <div className="muted">Kayıt sonrası tarif ekleyebilir, favorileyebilir ve fotoğrafla öneri alabilirsin.</div>
      </div>
    </div>
  );
}
