import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { logout } from "../authStore";

type Me = { id: number; full_name: string; email: string; role: string };
type Stats = { favorites: number; saved: number };

const TASTE_PROFILES = [
  { icon: "restaurant", label: "Umami", level: "Yüksek", color: "text-secondary-container border-secondary-container/30" },
  { icon: "eco", label: "Bitter", level: "Orta", color: "text-primary border-primary/20" },
  { icon: "local_fire_department", label: "Acı", level: "Düşük", color: "text-secondary border-secondary/20" },
  { icon: "water_drop", label: "Asit", level: "Extreme", color: "text-primary-container border-primary-container/20" },
];

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

  if (loading) return (
    <div className="page-loader">
      <span className="spinner spinner-primary" style={{ width: 36, height: 36 }} />
    </div>
  );

  if (err || !me) return (
    <div className="flex items-center justify-center py-24">
      <div className="px-6 py-4 bg-error-container text-on-error-container rounded-2xl">{err || "Kullanıcı bulunamadı"}</div>
    </div>
  );

  const initials = me.full_name
    ? me.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : me.email[0].toUpperCase();

  const nutrientScore = 82;
  const nutrientDash = 440;
  const nutrientOffset = nutrientDash - (nutrientDash * nutrientScore) / 100;

  return (
    <div className="pb-20">
      <main className="pt-8 pb-8 max-w-7xl mx-auto px-5 md:px-16">

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-label-caps font-semibold text-secondary tracking-widest uppercase mb-2 block">
                Kişisel Profil
              </span>
              <h1 className="text-display-lg-mobile md:text-display-lg font-bold text-primary tracking-tight">
                {me.full_name || "Culina Gurme"}
              </h1>
            </div>
          </div>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Left Column */}
          <div className="md:col-span-4 space-y-6">

            {/* User Card */}
            <div className="glass-card p-8 rounded-[32px] ambient-shadow">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-24 h-24 rounded-full mb-4 bg-gradient-to-br from-primary to-primary-fixed flex items-center justify-center text-white text-2xl font-black shadow-lg border-4 border-white">
                  {initials}
                </div>
                <h2 className="font-bold text-headline-md text-on-surface">{me.full_name || "İsimsiz Kullanıcı"}</h2>
                <p className="text-on-surface-variant text-sm">{me.email}</p>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  { label: "KULlANICI ID", value: `#${me.id}` },
                  { label: "ROL", value: me.role === "admin" ? "Admin" : "Kullanıcı" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-2 border-b border-outline-variant/30">
                    <span className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">{row.label}</span>
                    <span className="font-bold text-sm text-primary">{row.value}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={logout}
                className="w-full py-3 rounded-xl border border-error/20 text-error text-sm font-semibold hover:bg-error-container transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                Çıkış Yap
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Favori Tarif", val: stats?.favorites ?? 0, icon: "favorite", link: "/favorites", color: "text-secondary" },
                { label: "Kaydedilen", val: stats?.saved ?? 0, icon: "bookmark", link: "/saved", color: "text-primary" },
              ].map((s) => (
                <Link
                  key={s.label}
                  to={s.link}
                  className="glass-card rounded-2xl p-5 flex flex-col items-center text-center hover:scale-[1.02] transition-transform ambient-shadow"
                >
                  <span className={`material-symbols-outlined text-2xl mb-2 ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                  <span className="text-3xl font-black text-primary">{s.val}</span>
                  <span className="text-xs text-on-surface-variant mt-1">{s.label}</span>
                </Link>
              ))}
            </div>

            {/* Goals */}
            <div className="glass-card p-6 rounded-[32px] ambient-shadow">
              <h3 className="font-bold text-primary text-headline-md mb-4">Hedefler</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: "bolt", label: "ENERJİ OPTİMİZASYONU", color: "bg-primary/10 text-primary" },
                  { icon: "spa", label: "ANTI-İNFLAMATUAR", color: "bg-primary/10 text-primary" },
                  { icon: "psychology", label: "NÖRO-KORUMA", color: "bg-secondary/10 text-secondary" },
                ].map((g) => (
                  <div key={g.label} className={`${g.color} px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1`}>
                    <span className="material-symbols-outlined text-xs">{g.icon}</span>
                    {g.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="glass-card p-6 rounded-[32px] ambient-shadow">
              <h3 className="font-bold text-sm mb-4 text-on-surface">Hızlı Erişim</h3>
              <div className="space-y-2">
                {[
                  { to: "/recipes/add", icon: "add_circle", label: "Tarif Ekle", desc: "Kendi tarifini paylaş" },
                  { to: "/recommend/manual", icon: "grass", label: "Tarif Önerisi Al", desc: "Manuel malzeme seç" },
                  { to: "/recommend/image", icon: "photo_camera", label: "Fotoğrafla Öner", desc: "AI malzeme tespiti" },
                  { to: "/recipes/popular", icon: "star", label: "Popüler Tarifler", desc: "En çok sevilen tarifler" },
                ].map((l) => (
                  <Link key={l.to} to={l.to}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary text-sm">{l.icon}</span>
                    </div>
                    <div className="flex-grow">
                      <div className="font-semibold text-xs text-on-surface">{l.label}</div>
                      <div className="text-[10px] text-on-surface-variant">{l.desc}</div>
                    </div>
                    <span className="material-symbols-outlined text-outline-variant text-sm">arrow_forward_ios</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="md:col-span-8 space-y-6">

            {/* AI Taste Profile */}
            <div className="glass-card p-8 rounded-[32px] overflow-hidden relative ambient-shadow">
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <h2 className="font-bold text-headline-md text-primary">AI Lezzet Profili</h2>
                  <p className="text-on-surface-variant text-body-md">Son seçimlerinize göre duyusal şema.</p>
                </div>
                <div className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                  %98 DOĞRULUK
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                {TASTE_PROFILES.map((t) => (
                  <div key={t.label} className="flex flex-col items-center p-4 rounded-2xl bg-surface-container-low">
                    <div className={`w-16 h-16 rounded-full border-4 ${t.color} flex items-center justify-center mb-2`}>
                      <span className={`material-symbols-outlined ${t.color.split(" ")[0]}`}>{t.icon}</span>
                    </div>
                    <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{t.label}</span>
                    <span className="font-bold text-primary">{t.level}</span>
                  </div>
                ))}
              </div>
              <div className="absolute -right-20 -bottom-20 w-80 h-80 opacity-5">
                <span className="material-symbols-outlined text-[300px] text-primary">blur_on</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nutrient Gauge */}
              <div className="glass-card p-8 rounded-[32px] flex flex-col items-center text-center ambient-shadow">
                <h3 className="text-xs font-semibold text-on-surface-variant mb-6 tracking-widest uppercase">Haftalık Besin Yoğunluğu</h3>
                <div className="relative w-40 h-40 mb-4">
                  <svg className="w-full h-full" viewBox="0 0 160 160">
                    <circle className="text-surface-container-high" cx="80" cy="80" fill="transparent" r="70" stroke="currentColor" strokeWidth="8" />
                    <circle
                      className="progress-ring-circle text-primary"
                      cx="80" cy="80" fill="transparent" r="70"
                      stroke="url(#grad-profile)" strokeDasharray={nutrientDash}
                      strokeDashoffset={nutrientOffset} strokeLinecap="round" strokeWidth="8"
                    />
                    <defs>
                      <linearGradient id="grad-profile" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#154212" />
                        <stop offset="100%" stopColor="#a1d494" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-primary">{nutrientScore}</span>
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">A- PUAN</span>
                  </div>
                </div>
                <p className="text-sm text-on-surface-variant px-4">Lif ve demir hedeflerinize bu hafta 6 gün ulaştınız.</p>
              </div>

              {/* Macro Bars */}
              <div className="glass-card p-8 rounded-[32px] ambient-shadow">
                <h3 className="text-xs font-semibold text-on-surface-variant mb-6 tracking-widest uppercase">AI Optimize Makrolar</h3>
                <div className="space-y-5">
                  {[
                    { label: "Protein", current: 140, goal: 160, color: "bg-primary", pct: 87.5 },
                    { label: "Sağlıklı Yağlar", current: 65, goal: 70, color: "bg-secondary-container", pct: 92 },
                    { label: "Karbonhidrat", current: 210, goal: 250, color: "bg-primary-fixed", pct: 84 },
                  ].map((m) => (
                    <div key={m.label}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm font-semibold text-on-surface">{m.label}</span>
                        <span className="text-sm text-on-surface-variant">{m.current}g / {m.goal}g</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div className={`h-full ${m.color} rounded-full transition-all duration-700`} style={{ width: `${m.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className="glass-card rounded-[32px] overflow-hidden ambient-shadow">
              <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
                <h3 className="font-bold text-headline-md text-primary">Akıllı İçgörüler</h3>
              </div>
              <div className="divide-y divide-outline-variant/20">
                {[
                  { icon: "biotech", iconColor: "text-primary bg-primary/10", title: "Magnezyum optimizasyonu tespit edildi", desc: "Kahvaltı rutininize kabak çekirdeği ekledikten sonra uyku düzeniniz iyileşti. 7 gün daha sürdürün." },
                  { icon: "trending_up", iconColor: "text-secondary bg-secondary/10", title: "Metabolik esneklik zirvesi", desc: "Vücudunuz yakıt kaynakları arasında verimli geçiş yapıyor. Aralıklı oruç penceresi: bugün 20:00-12:00 önerilir." },
                ].map((ins) => (
                  <div key={ins.title} className="p-6 flex gap-4 items-start hover:bg-primary/5 transition-colors cursor-pointer">
                    <div className={`p-3 rounded-2xl flex-shrink-0 ${ins.iconColor}`}>
                      <span className="material-symbols-outlined">{ins.icon}</span>
                    </div>
                    <div>
                      <p className="font-bold text-on-surface mb-1">{ins.title}</p>
                      <p className="text-sm text-on-surface-variant leading-relaxed">{ins.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="culina-footer mt-8">
        <div className="culina-footer-inner">
          <span className="font-bold text-primary">Culina AI</span>
          <p className="text-xs text-on-surface-variant opacity-50">© 2024 Culina AI. Seçkin Mutfak Vizyoneri.</p>
        </div>
      </footer>
    </div>
  );
}
