import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

type Stats = { recipes: number; ingredients: number };

const FEATURES = [
  {
    icon: "📸",
    title: "Fotoğraf ile Tanıma",
    desc: "Mutfağındaki malzemeleri fotoğrafla. AI modeli otomatik olarak ne olduğunu tespit eder.",
    link: "/recommend/image",
    cta: "Fotoğraf Yükle",
    color: "var(--primary)",
  },
  {
    icon: "🥦",
    title: "Manuel Seçim",
    desc: "Elindeki malzemeleri kategorilere göre seç, miktarı gir ve sana özel tarifleri al.",
    link: "/recommend/manual",
    cta: "Malzeme Seç",
    color: "var(--ok)",
  },
  {
    icon: "⭐",
    title: "Favori & Kaydet",
    desc: "Beğendiğin tarifleri favorile, sonra pişireceklerini kaydet. Koleksiyonunu oluştur.",
    link: "/recipes",
    cta: "Tariflere Bak",
    color: "var(--warning)",
  },
];

const STEPS = [
  { num: "01", title: "Fotoğraf çek veya malzeme seç", desc: "Elindeki malzemeleri sisteme tanıt." },
  { num: "02", title: "AI önerileri al", desc: "Sistem en uygun tarifleri puanlayarak listeler." },
  { num: "03", title: "Pişir & keyif al", desc: "Detaylı tarif adımlarını takip ederek yemeği hazırla." },
];

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      api<{ total: number }>("GET", "/recipes?limit=1"),
      api<{ items: unknown[] }>("GET", "/ingredients"),
    ])
      .then(([r, i]) => setStats({ recipes: r.total, ingredients: i.items.length }))
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* ── Hero ── */}
      <section style={{ padding: "64px 0 48px", textAlign: "center", animation: "fadeUp 0.6s ease both" }}>
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 999, border: "1px solid rgba(124,92,255,0.35)",
            background: "rgba(124,92,255,0.1)", fontSize: 13, color: "var(--primary-light)",
            marginBottom: 24, animation: "fadeUp 0.5s ease both",
          }}
        >
          <span style={{ animation: "pulse 2s infinite" }}>✦</span>
          AI Destekli Tarif Öneri Sistemi
        </div>

        <h1
          style={{
            fontSize: "clamp(32px, 6vw, 58px)", fontWeight: 900, letterSpacing: "-2px",
            lineHeight: 1.1, margin: "0 auto 20px", maxWidth: 700,
          }}
        >
          Malzemelerinden{" "}
          <span
            style={{
              background: "linear-gradient(135deg, var(--primary-light), var(--ok))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}
          >
            Harika Tarifler
          </span>{" "}
          Keşfet
        </h1>

        <p style={{ fontSize: 17, color: "var(--muted)", maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.7 }}>
          Evindeki malzemeleri fotoğrafla veya manuel seç — sistem sana en uygun yemek tariflerini önersin.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 48 }}>
          <Link to="/recommend/image" className="btn primary btn-lg">
            📸 Fotoğraf Yükle
          </Link>
          <Link to="/recommend/manual" className="btn btn-lg">
            🥦 Manuel Seçim
          </Link>
          <Link to="/recipes/popular" className="btn btn-lg ghost">
            ⭐ Popüler Tarifler
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { val: stats.recipes, label: "Tarif" },
              { val: stats.ingredients, label: "Malzeme" },
              { val: "∞", label: "Öneri" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center", animation: `countUp 0.5s ${i * 0.1 + 0.3}s ease both` }}>
                <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-1px",
                  background: "linear-gradient(135deg, var(--primary-light), var(--ok))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {s.val}
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Features ── */}
      <section className="section">
        <div className="section-title" style={{ textAlign: "center" }}>Nasıl Çalışır?</div>
        <div className="grid stagger" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="card" style={{ textAlign: "center", padding: 28 }}>
              <div style={{ fontSize: 44, marginBottom: 16, animation: "heroFloat 5s ease-in-out infinite", display: "inline-block" }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>{f.desc}</p>
              <Link to={f.link} className="btn primary" style={{ width: "100%", justifyContent: "center" }}>
                {f.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Steps ── */}
      <section className="section" style={{ marginBottom: 40 }}>
        <div className="section-title" style={{ textAlign: "center" }}>3 Adımda Tarif Öner</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 16 }}>
          {STEPS.map((s, i) => (
            <div key={s.num} className="card" style={{ animation: `fadeUp 0.4s ${i * 0.12 + 0.1}s ease both` }}>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-1px",
                background: "linear-gradient(135deg, var(--primary-light), var(--ok))",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                marginBottom: 12 }}>
                {s.num}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
