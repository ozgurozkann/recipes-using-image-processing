import { useEffect, useState } from "react";
import { api } from "../api";
<<<<<<< Updated upstream
import RecipeCard, { RecipeCardData } from "../components/RecipeCard";
import { PageLoader } from "../components/Spinner";
=======
import { toast, toastError } from "../components/Toast";
import { getRecipePhoto } from "../recipePhotos";

type PopularRecipe = {
  id: number; title: string; description?: string;
  favorite_count: number; save_count: number; difficulty?: string;
  cooking_time?: number; serving_count?: number; category_id?: number | null; image_url?: string;
  is_favorited?: boolean; is_saved?: boolean;
};

const DIFFICULTY_LABEL: Record<string, string> = { easy: "Kolay", medium: "Orta", hard: "Zor" };

function formatCount(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return String(value);
}
>>>>>>> Stashed changes

export default function PopularRecipesPage() {
  const [items, setItems] = useState<RecipeCardData[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api<{ items: RecipeCardData[] }>("GET", "/recipes/popular")
      .then((d) => setItems(d.items))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="page-hero">
        <h1 className="page-title">⭐ En <span>Popüler</span> Tarifler</h1>
        <p className="page-sub">Favori ve kaydetme sayısına göre sıralanmış en sevilen tarifler.</p>
      </div>

      {/* Top 3 podium */}
      {!loading && items.length >= 3 && (
        <div className="card" style={{ padding: "28px 24px", marginBottom: 8, animation: "fadeUp 0.4s ease both" }}>
          <div className="section-title">🏆 Podyum</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: 16, alignItems: "end" }}>
            {[items[1], items[0], items[2]].map((r, pos) => {
              const actualRank = pos === 0 ? 2 : pos === 1 ? 1 : 3;
              const heights = ["180px", "220px", "160px"];
              return (
                <div key={r.id} style={{ textAlign: "center", animation: `fadeUp 0.4s ${pos * 0.1}s ease both` }}>
                  <div style={{ height: heights[pos], background: "var(--panel2)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius) var(--radius) 0 0", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 32, position: "relative" }}>
                    <span className={`rank-badge rank-${actualRank}`} style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)" }}>
                      {actualRank}
                    </span>
                    {["🍜", "🍲", "🥘", "🫕", "🥗", "🍳", "🥙", "🍱"][r.id % 8]}
                  </div>
                  <div style={{ padding: "10px 6px 0", fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>♡ {r.favorite_count}</div>
                </div>
              );
            })}
          </div>
<<<<<<< Updated upstream
=======
          <p className="text-on-surface-variant text-body-lg max-w-2xl">
            Favori ve kaydetme sayısına göre sıralanmış, topluluğumuzun en çok sevdiği seçkin lezzetler.
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
              <h2 className="font-bold text-on-surface">Podyum</h2>
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
            <h2 className="font-bold text-on-surface">Tüm Popüler Tarifler</h2>
            <div className="flex gap-2">
              {(["all", "quick"] as const).map((f) => (
                <button key={f}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === f ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant hover:bg-outline-variant/30"}`}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "Tümü" : "Hızlı (≤30dk)"}
                </button>
              ))}
            </div>
          </div>

          {visibleItems.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <span className="material-symbols-outlined text-outline text-4xl">filter_alt_off</span>
              <p className="text-on-surface-variant">Bu filtrede gösterilecek tarif yok.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleItems.map((recipe, index) => (
                <PopularCard key={recipe.id} recipe={recipe} rank={index + 1} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="culina-footer mt-12">
        <div className="culina-footer-inner">
          <span className="font-bold text-primary">Recipe AI</span>
          <p className="text-xs text-on-surface-variant opacity-50">© 2024 Recipe AI.</p>
>>>>>>> Stashed changes
        </div>
      )}

      {err && <div className="error">{err}</div>}

      {loading ? (
        <PageLoader />
      ) : (
        <div className="grid stagger" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", marginTop: 16 }}>
          {items.map((r, i) => (
            <RecipeCard key={r.id} recipe={r} rank={i + 1} onRefresh={load} />
          ))}
        </div>
      )}
    </div>
  );
}
<<<<<<< Updated upstream
=======

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
        </div>
      </div>
    </Link>
  );
}

function PopularCard({ recipe, rank }: { recipe: PopularRecipe; rank: number }) {
  const photo = getRecipePhoto(recipe, 720, 540);
  const difficulty = recipe.difficulty ? DIFFICULTY_LABEL[recipe.difficulty] || recipe.difficulty : null;
  const [isFav, setIsFav] = useState(!!recipe.is_favorited);
  const [isSaved, setIsSaved] = useState(!!recipe.is_saved);

  async function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    const next = !isFav;
    setIsFav(next);
    try {
      await api(next ? "POST" : "DELETE", `/recipes/${recipe.id}/favorite`);
      toast(next ? "Favorilere eklendi" : "Favorilerden çıkarıldı");
    } catch (error: any) { setIsFav(!next); toastError("Hata", error.message); }
  }

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    const next = !isSaved;
    setIsSaved(next);
    try {
      await api(next ? "POST" : "DELETE", `/recipes/${recipe.id}/save`);
      toast(next ? "Kaydedildi" : "Kayıt kaldırıldı");
    } catch (error: any) { setIsSaved(!next); toastError("Hata", error.message); }
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
        <button className="absolute top-3 right-3 p-1.5 rounded-full bg-black/30 hover:bg-black/50 transition-colors" onClick={handleSave} title="Kaydet"
          style={{ color: isSaved ? "#f59e0b" : "white" }}>
          <span className="material-symbols-outlined text-sm"
            style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
        </button>
      </div>
      <div className="recipe-card-body">
        <Link to={`/recipes/${recipe.id}`}>
          <h3 className="font-semibold text-on-surface leading-snug mb-2 hover:text-primary transition-colors">{recipe.title}</h3>
        </Link>
        <div className="flex items-center gap-3 text-xs text-on-surface-variant mb-2">
          {recipe.cooking_time ? <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">schedule</span>{recipe.cooking_time} dk</span> : null}
          {recipe.serving_count ? <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">group</span>{recipe.serving_count} kişi</span> : null}
        </div>
        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-outline-variant/20">
          <button className="flex items-center gap-1 text-xs transition-colors" onClick={handleFavorite}
            style={{ color: isFav ? "#e53935" : undefined }}>
            <span className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: isFav ? "'FILL' 1" : "'FILL' 0", color: isFav ? "#e53935" : undefined }}>favorite</span>
            {formatCount(recipe.favorite_count)}
          </button>
          <button className="flex items-center gap-1 text-xs transition-colors" onClick={handleSave}
            style={{ color: isSaved ? "#f59e0b" : undefined }}>
            <span className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0", color: isSaved ? "#f59e0b" : undefined }}>bookmark</span>
            {formatCount(recipe.save_count)}
          </button>
          <Link to={`/recipes/${recipe.id}`} className="ml-auto text-xs font-semibold text-primary hover:underline">Gör</Link>
        </div>
      </div>
    </article>
  );
}
>>>>>>> Stashed changes
