import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { PageLoader } from "../components/Spinner";
import { logout } from "../authStore";

type Me = { id: number; full_name: string; email: string; role: string };
type Stats = { favorites: number; saved: number };

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<Me>("GET", "/auth/me"),
      api<{ items: unknown[] }>("GET", "/users/me/favorites"),
      api<{ items: unknown[] }>("GET", "/users/me/saved"),
    ])
      .then(([m, fav, sav]) => {
        setMe(m);
        setStats({ favorites: fav.items.length, saved: sav.items.length });
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (err || !me) return <div className="error">{err || "Kullanıcı bulunamadı"}</div>;

  const initials = me.full_name
    ? me.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : me.email[0].toUpperCase();

  return (
    <div>
      <div className="page-hero">
        <h1 className="page-title"><span>Profilim</span></h1>
        <p className="page-sub">Hesap bilgilerin ve istatistiklerin.</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "320px 1fr" }}>
        {/* Profile card */}
        <div className="card" style={{ textAlign: "center", padding: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%", margin: "0 auto 16px",
            background: "linear-gradient(135deg, var(--primary), var(--ok))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 900, color: "#fff",
            boxShadow: "0 8px 32px var(--primary-glow)",
            animation: "scaleIn 0.4s var(--transition-bounce) both",
          }}>
            {initials}
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
            {me.full_name || "İsimsiz Kullanıcı"}
          </h2>
          <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16 }}>{me.email}</div>

          <span className={`badge ${me.role === "admin" ? "danger" : "primary"}`} style={{ fontSize: 13 }}>
            {me.role === "admin" ? "👑 Admin" : "👤 Kullanıcı"}
          </span>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
            <button className="btn danger" onClick={logout} style={{ width: "100%", justifyContent: "center" }}>
              Çıkış Yap
            </button>
          </div>
        </div>

        {/* Stats & links */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Stats */}
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", margin: 0 }}>
            {[
              { label: "Favori Tarif", val: stats?.favorites ?? 0, icon: "♡", link: "/favorites", color: "var(--danger)" },
              { label: "Kaydedilen", val: stats?.saved ?? 0, icon: "⬇", link: "/saved", color: "var(--ok)" },
            ].map((s, i) => (
              <Link key={s.label} to={s.link}
                className="card"
                style={{ textDecoration: "none", animation: `fadeUp 0.4s ${i * 0.1}s ease both` }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-1px",
                  background: `linear-gradient(135deg, ${s.color}, var(--primary))`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  animation: "countUp 0.5s 0.3s ease both" }}>
                  {s.val}
                </div>
                <div style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>{s.label}</div>
              </Link>
            ))}
          </div>

          {/* Quick links */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Hızlı Erişim</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { to: "/recipes/add", icon: "➕", label: "Tarif Ekle", desc: "Kendi tarifini paylaş" },
                { to: "/recommend/manual", icon: "🥦", label: "Tarif Önerisi Al", desc: "Manuel malzeme seç" },
                { to: "/recommend/image", icon: "📸", label: "Fotoğrafla Öner", desc: "AI malzeme tespiti" },
                { to: "/recipes/popular", icon: "⭐", label: "Popüler Tarifler", desc: "En çok sevilen tarifler" },
              ].map((l, i) => (
                <Link key={l.to} to={l.to}
                  className="card card-sm"
                  style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none",
                    animation: `fadeUp 0.4s ${i * 0.08}s ease both` }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: "var(--radius-sm)", background: "var(--primary-subtle)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {l.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{l.label}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{l.desc}</div>
                  </div>
                  <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: 16 }}>›</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7 }}>
              <strong style={{ color: "var(--text)" }}>Kullanıcı ID:</strong> #{me.id} &nbsp;·&nbsp;
              <strong style={{ color: "var(--text)" }}>Rol:</strong> {me.role}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
