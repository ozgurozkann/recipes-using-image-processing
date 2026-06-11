import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import { toast, toastError } from "../components/Toast";
import { getToken } from "../authStore";

type RecipeIngredient = {
  ingredient_id: number;
  name: string;
  quantity: number;
  unit: string;
};

type Recipe = {
  id: number; title: string; description: string; instructions: string;
  cooking_time: number; serving_count: number; difficulty: string;
  category_id: number | null; image_url: string;
  favorite_count: number; save_count: number; is_approved: boolean;
  is_favorited?: boolean; is_saved?: boolean;
  ingredients: RecipeIngredient[];
};

const DIFFICULTY_LABEL: Record<string, string> = { easy: "Kolay", medium: "Orta", hard: "Zor" };

const FOOD_PHOTOS = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1484723091739-30f299680de?w=1400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&h=600&fit=crop",
];

function getPhotoUrl(id: number, image_url?: string) {
  if (image_url) return image_url;
  return FOOD_PHOTOS[id % FOOD_PHOTOS.length];
}

function splitSteps(text: string): string[] {
  if (!text?.trim()) return [];
  const byLine = text.split(/\n+/).map((s) => s.trim()).filter((s) => s.length > 4);
  if (byLine.length > 1) return byLine;
  const steps = text
    .split(/\.(?:\s+)(?=[A-ZÇĞİÖŞÜA-Z0-9])/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 6)
    .map((s) => (s.endsWith(".") || s.endsWith("!") ? s : s + "."));
  return steps.length > 1 ? steps : [text.trim()];
}

export default function RecipeDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<Recipe | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [saved, setSaved] = useState(false);
  const token = getToken();

  function load() {
    setLoading(true);
    api<Recipe>("GET", `/recipes/${id}`)
      .then((r) => { setItem(r); setFavorited(Boolean(r.is_favorited)); setSaved(Boolean(r.is_saved)); })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  async function toggleFavorite() {
    if (!token) { toastError("Giriş gerekli", "Favorilere eklemek için giriş yapın."); return; }
    try {
      const res = await api<{ favorited: boolean }>(favorited ? "DELETE" : "POST", `/recipes/${id}/favorite`);
      setFavorited(res.favorited);
      toast(res.favorited ? "Favorilere eklendi" : "Favorilerden çıkarıldı");
      load();
    } catch (e: any) { toastError("Hata", e.message); }
  }

  async function toggleSave() {
    if (!token) { toastError("Giriş gerekli", "Kaydetmek için giriş yapın."); return; }
    try {
      const res = await api<{ saved: boolean }>(saved ? "DELETE" : "POST", `/recipes/${id}/save`);
      setSaved(res.saved);
      toast(res.saved ? "Tarif kaydedildi" : "Kayıt kaldırıldı");
      load();
    } catch (e: any) { toastError("Hata", e.message); }
  }

  if (loading) return (
    <div className="page-loader">
      <div className="flex flex-col items-center gap-4">
        <span className="spinner spinner-primary" style={{ width: 36, height: 36 }} />
        <p className="text-on-surface-variant text-sm">Yükleniyor…</p>
      </div>
    </div>
  );

  if (err) return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 px-5">
      <div className="px-6 py-4 bg-error-container text-on-error-container rounded-2xl flex items-center gap-3">
        <span className="material-symbols-outlined">error</span> {err}
      </div>
      <Link to="/recipes" className="bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary-container transition-all">
        ← Tariflere Dön
      </Link>
    </div>
  );

  if (!item) return null;

  const steps = splitSteps(item.instructions);

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-5 md:px-16 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-6 text-on-surface-variant/60 text-xs font-semibold uppercase tracking-wider">
          <Link to="/recipes" className="hover:text-primary transition-colors">Tarifler</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary font-bold">{item.title}</span>
        </nav>

        {/* Hero Image */}
        <div className="relative overflow-hidden rounded-2xl h-[440px] ambient-shadow">
          <img
            src={getPhotoUrl(item.id, item.image_url)}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = FOOD_PHOTOS[0]; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {item.difficulty && (
                <span className="px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-white"
                  style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
                  {DIFFICULTY_LABEL[item.difficulty] || item.difficulty}
                </span>
              )}
              {item.cooking_time > 0 && (
                <span className="px-4 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1"
                  style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
                  <span className="material-symbols-outlined text-xs">timer</span>
                  {item.cooking_time} dk
                </span>
              )}
              {item.serving_count > 0 && (
                <span className="px-4 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1"
                  style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
                  <span className="material-symbols-outlined text-xs">group</span>
                  {item.serving_count} kişi
                </span>
              )}
            </div>

            <h1 className="text-display-lg-mobile md:text-display-lg font-bold text-white mb-4">{item.title}</h1>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={toggleFavorite}
                className={`flex items-center gap-2 px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-lg ${
                  favorited ? "bg-secondary text-white" : "bg-secondary text-white"
                }`}
              >
                <span className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: favorited ? "'FILL' 1" : "'FILL' 0" }}>
                  favorite
                </span>
                {favorited ? "FAVORİLENDİ" : "FAVORİLE"}
              </button>
              <button
                onClick={toggleSave}
                className="flex items-center gap-2 px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", color: "white" }}
              >
                <span className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}>
                  bookmark
                </span>
                {saved ? "KAYDEDİLDİ" : "KAYDET"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-5 md:px-16 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Ingredients + Steps */}
        <div className="lg:col-span-8 space-y-6">
          {/* Description */}
          {item.description && (
            <div className="bg-white rounded-2xl p-6 ambient-shadow border border-black/5">
              <p className="text-on-surface-variant text-body-md leading-relaxed">{item.description}</p>
            </div>
          )}

          {/* Ingredients */}
          {item.ingredients && item.ingredients.length > 0 && (
            <div className="bg-white rounded-2xl p-6 ambient-shadow border border-black/5">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary text-2xl">shopping_basket</span>
                <h2 className="text-headline-md font-semibold text-on-surface">Malzemeler</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {item.ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center p-4 bg-surface-container-low rounded-xl border border-black/[0.03] hover:bg-white hover:shadow-sm transition-all">
                    <div className="w-3 h-3 rounded-full bg-secondary mr-4 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-on-surface text-sm capitalize">{ing.name}</span>
                      <span className="text-on-surface-variant text-xs ml-2">
                        {ing.quantity % 1 === 0 ? ing.quantity : ing.quantity.toFixed(2)} {ing.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Steps */}
          {steps.length > 0 && (
            <div className="bg-white rounded-2xl p-6 ambient-shadow border border-black/5">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary text-2xl">restaurant_menu</span>
                <h2 className="text-headline-md font-semibold text-on-surface">Hazırlanışı</h2>
              </div>
              <div className="space-y-4">
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </span>
                    <p className="text-on-surface-variant text-body-md leading-relaxed pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: AI Analysis */}
        <aside className="lg:col-span-4 space-y-6">
          {/* AI Card */}
          <div className="bg-surface-container-high rounded-2xl p-6 ambient-shadow border border-black/5">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <h3 className="text-headline-md font-semibold text-on-surface">AI Analizi</h3>
            </div>
            <p className="text-on-surface-variant text-body-md mb-6 leading-relaxed">
              {item.description || "Bu tarif, taze malzemeler sayesinde zengin besin değeri içerir ve sağlıklı bir beslenme düzenine uygundur."}
            </p>
            <div className="space-y-3">
              {[
                { label: "Favori", value: item.favorite_count, icon: "favorite" },
                { label: "Kaydeden", value: item.save_count, icon: "bookmark" },
                ...(item.cooking_time ? [{ label: "Süre", value: `${item.cooking_time} dk`, icon: "timer" }] : []),
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                  <span className="text-xs font-semibold text-on-surface uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">{stat.icon}</span>
                    {stat.label}
                  </span>
                  <span className="font-bold text-primary">{stat.value}</span>
                </div>
              ))}
            </div>
            {item.difficulty && (
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="bg-secondary-fixed text-on-secondary-container px-3 py-1 rounded-full text-xs font-semibold">
                  {DIFFICULTY_LABEL[item.difficulty] || item.difficulty}
                </span>
              </div>
            )}
          </div>

          {/* Back to list */}
          <Link
            to="/recipes"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary transition-all font-semibold text-sm"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Tüm Tariflere Dön
          </Link>
        </aside>
      </section>
    </div>
  );
}
