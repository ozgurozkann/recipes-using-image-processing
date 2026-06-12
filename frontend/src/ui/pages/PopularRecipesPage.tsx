import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { toast, toastError } from "../components/Toast";
import { getRecipePhoto } from "../recipePhotos";
import { useLanguage } from "../i18n";

type PopularRecipe = {
  id: number; title: string; description?: string;
  favorite_count: number; save_count: number; difficulty?: string;
  cooking_time?: number; serving_count?: number; category_id?: number | null; image_url?: string;
  avg_rating?: number | null; review_count?: number | null;
};

function formatCount(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return String(value);
}

export default function PopularRecipesPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<PopularRecipe[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "quick">("all");

  function load() {
    setLoading(true); setErr(null);
    api<{ items: PopularRecipe[] }>("GET", "/recipes/popular")
      .then((d) => setItems(d.items))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const podium = useMemo(() => {
    if (items.length < 3) return [];
    return [
      { recipe: items[1], rank: 2 as const },
      { recipe: items[0], rank: 1 as const },
      { recipe: items[2], rank: 3 as const },
    ];
  }, [items]);

  const visibleItems = useMemo(() => (
    filter === "quick" ? items.filter((i) => (i.cooking_time || 0) <= 30) : items
  ), [filter, items]);

  if (loading) return (
    <div className="page-loader">
      <span className="spinner spinner-primary" style={{ width: 36, height: 36 }} />
    </div>
  );

  return (
    <div className="pb-20">
      <main className="pt-8 max-w-7xl mx-auto px-5 md:px-16">

        {/* Hero */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-secondary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <h1 className="text-display-lg-mobile md:text-display-lg font-bold text-on-surface tracking-tight">
              {t("pop_h1")}
            </h1>
          </div>
          <p className="text-on-surface-variant text-body-lg max-w-2xl">
            {t("pop_desc")}
          </p>
        </section>

        {err && (
          <div className="mb-6 px-4 py-3 bg-error-container text-on-error-container rounded-xl text-sm font-medium">{err}</div>
        )}

        {/* Podium */}
        {podium.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary">military_tech</span>
              <h2 className="font-bold text-on-surface">{t("pop_podium")}</h2>
            </div>
            <div className="grid grid-cols-3 gap-4 items-end">
              {podium.map(({ recipe, rank }) => (
                <PodiumCard key={recipe.id} recipe={recipe} rank={rank} />
              ))}
            </div>
          </section>
        )}

        {/* List */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-on-surface">{t("pop_all_h2")}</h2>
            <div className="flex gap-2">
              {(["all", "quick"] as const).map((f) => (
                <button key={f}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === f ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant hover:bg-outline-variant/30"}`}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? t("pop_filter_all") : t("pop_filter_quick")}
                </button>
              ))}
            </div>
          </div>

          {visibleItems.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <span className="material-symbols-outlined text-outline text-4xl">filter_alt_off</span>
              <p className="text-on-surface-variant">{t("pop_empty")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleItems.map((recipe, index) => (
                <PopularCard key={recipe.id} recipe={recipe} rank={index + 1} onRefresh={load} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="culina-footer mt-12">
        <div className="culina-footer-inner">
          <span className="font-bold text-primary">Recipe AI</span>
          <p className="text-xs text-on-surface-variant opacity-50">© 2024 Recipe AI.</p>
        </div>
      </footer>
    </div>
  );
}

function PodiumCard({ recipe, rank }: { recipe: PopularRecipe; rank: 1 | 2 | 3 }) {
  const photo = getRecipePhoto(recipe, 800, 600);
  const isWinner = rank === 1;
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className={`block relative rounded-2xl overflow-hidden group ${isWinner ? "h-64 row-span-1" : "h-48"} ambient-shadow`}
    >
      <img src={photo} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className={`absolute top-3 left-3 flex items-center justify-center w-9 h-9 rounded-full font-black text-sm ${rank === 1 ? "bg-yellow-400 text-yellow-900" : rank === 2 ? "bg-gray-300 text-gray-700" : "bg-orange-400 text-orange-900"}`}>
        {rank}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-bold text-sm leading-snug mb-1">{recipe.title}</h3>
        <div className="flex items-center gap-3 text-white/80 text-xs">
          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>{formatCount(recipe.favorite_count)}</span>
          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>{formatCount(recipe.save_count)}</span>
          {recipe.avg_rating != null && recipe.review_count != null && recipe.review_count > 0 && (
            <span className="flex items-center gap-0.5 text-yellow-300 font-semibold">
              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              {recipe.avg_rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function PopularCard({ recipe, rank, onRefresh }: { recipe: PopularRecipe; rank: number; onRefresh: () => void }) {
  const { lang, t } = useLanguage();
  const photo = getRecipePhoto(recipe, 720, 540);
  const diffLabel = (d: string) => ({ easy: t("diff_easy"), medium: t("diff_medium"), hard: t("diff_hard") }[d] ?? d);
  const difficulty = recipe.difficulty ? diffLabel(recipe.difficulty) : null;

  async function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    try {
      const res = await api<{ favorited: boolean }>("POST", `/recipes/${recipe.id}/favorite`);
      toast(res.favorited ? (lang === "tr" ? "Favorilere eklendi" : "Added to favorites") : (lang === "tr" ? "Favorilerden çıkarıldı" : "Removed from favorites"));
      onRefresh();
    } catch (error: any) { toastError(lang === "tr" ? "Hata" : "Error", error.message); }
  }

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    try {
      const res = await api<{ saved: boolean }>("POST", `/recipes/${recipe.id}/save`);
      toast(res.saved ? (lang === "tr" ? "Kaydedildi" : "Saved") : (lang === "tr" ? "Kayıt kaldırıldı" : "Unsaved"));
      onRefresh();
    } catch (error: any) { toastError(lang === "tr" ? "Hata" : "Error", error.message); }
  }

  return (
    <article className="recipe-card">
      <div className="recipe-card-image">
        <Link to={`/recipes/${recipe.id}`} className="block w-full h-full">
          <img src={photo} alt={recipe.title} loading="lazy" className="w-full h-full object-cover" />
        </Link>
        <span className="absolute top-3 left-3 text-xs font-black px-2.5 py-1 rounded-full bg-primary text-white">#{rank}</span>
        {difficulty && (
          <span className="absolute top-3 right-12 text-[10px] font-bold px-2 py-1 rounded-full bg-black/40 text-white backdrop-blur-sm">{difficulty}</span>
        )}
        <button className="absolute top-3 right-3 p-1.5 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors" onClick={handleSave} title={t("detail_save_btn")}>
          <span className="material-symbols-outlined text-sm">bookmark</span>
        </button>
      </div>
      <div className="recipe-card-body">
        <Link to={`/recipes/${recipe.id}`}>
          <h3 className="font-semibold text-on-surface leading-snug mb-2 hover:text-primary transition-colors">{recipe.title}</h3>
        </Link>
        <div className="flex items-center gap-3 text-xs text-on-surface-variant mb-2">
          {recipe.cooking_time ? <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">schedule</span>{recipe.cooking_time} {t("unit_dk")}</span> : null}
          {recipe.serving_count ? <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">group</span>{recipe.serving_count} {t("unit_kisi")}</span> : null}
        </div>
        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-outline-variant/20">
          <button className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-secondary transition-colors" onClick={handleFavorite}>
            <span className="material-symbols-outlined text-sm">favorite</span>{formatCount(recipe.favorite_count)}
          </button>
          <span className="flex items-center gap-1 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">bookmark</span>{formatCount(recipe.save_count)}
          </span>
          {recipe.avg_rating != null && recipe.review_count != null && recipe.review_count > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-amber-500 font-semibold">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              {recipe.avg_rating.toFixed(1)}
              <span className="text-on-surface-variant font-normal">({recipe.review_count})</span>
            </span>
          )}
          <Link to={`/recipes/${recipe.id}`} className="ml-auto text-xs font-semibold text-primary hover:underline">{t("pop_view")}</Link>
        </div>
      </div>
    </article>
  );
}
