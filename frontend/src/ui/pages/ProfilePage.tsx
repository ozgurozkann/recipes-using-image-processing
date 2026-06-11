import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { logout } from "../authStore";
import { getRecentSearchTerms } from "../searchInsights";

type Me = { id: number; full_name: string; email: string; role: string; avatar_url?: string | null };
type Stats = {
  favorites: number;
  saved: number;
  recipes_added: number;
  reviews: number;
  weekly: {
    favorites: number;
    saved: number;
    recipes_added: number;
    reviews: number;
    score: number;
  };
};

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
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      api<Me>("GET", "/auth/me"),
      api<Stats>("GET", "/users/me/profile-summary"),
    ])
      .then(([m, summary]) => {
        setMe(m);
        setStats(summary);
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !me) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const updated = await api<Me>("POST", "/users/me/avatar", fd, true);
      setMe((prev) => prev ? { ...prev, avatar_url: updated.avatar_url } : prev);
      window.dispatchEvent(new CustomEvent("avatar-updated", { detail: updated.avatar_url ?? null }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  }

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

  const recentSearches = getRecentSearchTerms();
  const primarySearch = recentSearches[0]?.term;
  const secondarySearch = recentSearches[1]?.term;
  const activityScore = stats?.weekly.score ?? 0;
  const nutrientScore = activityScore;
  const nutrientDash = 440;
  const nutrientOffset = nutrientDash - (nutrientDash * nutrientScore) / 100;
  const activityRows = [
    { label: "Tarif ekleme", count: stats?.weekly.recipes_added ?? 0, points: 30, color: "bg-primary" },
    { label: "Yorum yapma", count: stats?.weekly.reviews ?? 0, points: 15, color: "bg-secondary-container" },
    { label: "Beğeni", count: stats?.weekly.favorites ?? 0, points: 10, color: "bg-primary-fixed" },
    { label: "Kaydetme", count: stats?.weekly.saved ?? 0, points: 8, color: "bg-secondary" },
  ];
  const insights = [
    primarySearch
      ? {
          icon: "search",
          iconColor: "text-primary bg-primary/10",
          title: `"${primarySearch}" aramaları öne çıkıyor`,
          desc: secondarySearch
            ? `Son aramalarınızda "${primarySearch}" ve "${secondarySearch}" dikkat çekiyor. Önerilerde bu temaya yakın tarifleri takip edebilirsiniz.`
            : `Son aramanız "${primarySearch}". Benzer malzemelerle öneri alırsanız daha isabetli sonuçlar çıkar.`,
        }
      : {
          icon: "travel_explore",
          iconColor: "text-primary bg-primary/10",
          title: "Arama alışkanlığı henüz oluşmadı",
          desc: "Tarif veya malzeme aradıkça bu alan ilgi alanlarınıza göre şekillenecek.",
        },
    (stats?.saved ?? 0) >= (stats?.favorites ?? 0)
      ? {
          icon: "bookmark",
          iconColor: "text-secondary bg-secondary/10",
          title: "Kaydetme eğiliminiz güçlü",
          desc: `${stats?.saved ?? 0} tarif kaydettiniz. Kaydettiklerinizi haftalık menü planı gibi kullanabilirsiniz.`,
        }
      : {
          icon: "favorite",
          iconColor: "text-secondary bg-secondary/10",
          title: "Beğendiğiniz tarifler profilinizi belirliyor",
          desc: `${stats?.favorites ?? 0} favori tarifiniz var. Benzer lezzetlerde yeni tarif keşfi için iyi bir sinyal oluştu.`,
        },
    {
      icon: "trending_up",
      iconColor: "text-primary bg-primary/10",
      title: activityScore >= 70 ? "Bu hafta etkileşim yoğun" : "Bu hafta aktivite alanı açık",
      desc: `Haftalık puanınız ${activityScore}. Tarif ekleme, yorum, beğeni ve kaydetme yaptıkça bu skor yükselir.`,
    },
  ];

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
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="relative w-24 h-24 rounded-full mb-4 shadow-lg border-4 border-white group focus:outline-none"
                  title="Fotoğrafı değiştir"
                >
                  {me.avatar_url ? (
                    <img
                      src={me.avatar_url}
                      alt="Profil fotoğrafı"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-primary-fixed flex items-center justify-center text-white text-2xl font-black">
                      {initials}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {avatarUploading
                      ? <span className="spinner" style={{ width: 20, height: 20, borderColor: "white", borderTopColor: "transparent" }} />
                      : <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
                    }
                  </div>
                </button>
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

            {/* Quick Links */}
            <div className="glass-card p-6 rounded-[32px] ambient-shadow">
              <h3 className="font-bold text-sm mb-4 text-on-surface">Hızlı Erişim</h3>
              <div className="space-y-2">
                {[
                  { to: "/recipes/add", icon: "add_circle", label: "Tarif Ekle", desc: "Kendi tarifini paylaş" },
                  { to: "/recommend", icon: "grass", label: "Tarif Önerisi Al", desc: "Manuel malzeme seç" },
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
              {/* Activity Gauge */}
              <div className="glass-card p-8 rounded-[32px] flex flex-col items-center text-center ambient-shadow">
                <h3 className="text-xs font-semibold text-on-surface-variant mb-6 tracking-widest uppercase">Haftalık Aktivite Puanı</h3>
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
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">PUAN</span>
                  </div>
                </div>
                <p className="text-sm text-on-surface-variant px-4">Tarif ekleme, yorum, beğeni ve kaydetme hareketlerine göre hesaplanır.</p>
              </div>

              {/* Activity Bars */}
              <div className="glass-card p-8 rounded-[32px] ambient-shadow">
                <h3 className="text-xs font-semibold text-on-surface-variant mb-6 tracking-widest uppercase">Puan Dağılımı</h3>
                <div className="space-y-5">
                  {activityRows.map((m) => (
                    <div key={m.label}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm font-semibold text-on-surface">{m.label}</span>
                        <span className="text-sm text-on-surface-variant">{m.count} kez · +{m.points} puan</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                        <div className={`h-full ${m.color} rounded-full transition-all duration-700`} style={{ width: `${Math.min(100, m.count * m.points)}%` }} />
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
                {insights.map((ins) => (
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
          <span className="font-bold text-primary">Recipe AI</span>
          <p className="text-xs text-on-surface-variant opacity-50">© 2024 Recipe AI. Seçkin Mutfak Vizyoneri.</p>
        </div>
      </footer>
    </div>
  );
}
