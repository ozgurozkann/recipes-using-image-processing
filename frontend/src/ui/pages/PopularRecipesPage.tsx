import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { PageLoader } from "../components/Spinner";
import { toast, toastError } from "../components/Toast";
import { getRecipePhoto } from "../recipePhotos";

type PopularRecipe = {
  id: number;
  title: string;
  description?: string;
  favorite_count: number;
  save_count: number;
  difficulty?: string;
  cooking_time?: number;
  serving_count?: number;
  category_id?: number | null;
  image_url?: string;
};

const DIFFICULTY_LABEL: Record<string, string> = { easy: "Kolay", medium: "Orta", hard: "Zor" };

export default function PopularRecipesPage() {
  const [items, setItems] = useState<PopularRecipe[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "quick">("all");

  function load() {
    setLoading(true);
    setErr(null);
    api<{ items: PopularRecipe[] }>("GET", "/recipes/popular")
      .then((d) => setItems(d.items))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const podium = useMemo(() => {
    if (items.length < 3) return [];
    return [
      { recipe: items[1], rank: 2 as const, size: "side" as const },
      { recipe: items[0], rank: 1 as const, size: "winner" as const },
      { recipe: items[2], rank: 3 as const, size: "side" as const },
    ];
  }, [items]);

  const visibleItems = useMemo(() => (
    filter === "quick" ? items.filter((item) => (item.cooking_time || 0) <= 30) : items
  ), [filter, items]);

  if (loading) {
    return <main className="popular-page"><PageLoader /></main>;
  }

  return (
    <main className="popular-page">
      <section className="popular-header">
        <div className="popular-title-row">
          <span className="material-symbols-outlined popular-star" aria-hidden="true">star</span>
          <h1>En Popüler Tarifler</h1>
        </div>
        <p>Favori ve kaydetme sayısına göre sıralanmış, topluluğumuzun en çok sevdiği seçkin lezzetler.</p>
      </section>

      {err && <div className="popular-error">{err}</div>}

      {podium.length > 0 && (
        <section className="popular-podium-section">
          <div className="popular-section-kicker">
            <span className="material-symbols-outlined" aria-hidden="true">military_tech</span>
            <span>Podyum</span>
          </div>
          <div className="popular-podium">
            {podium.map(({ recipe, rank, size }) => (
              <PodiumCard key={recipe.id} recipe={recipe} rank={rank} size={size} />
            ))}
          </div>
        </section>
      )}

      <section className="popular-list-section">
        <div className="popular-list-head">
          <h2>Tüm Popüler Tarifler</h2>
          <div className="popular-filter">
            <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")} type="button">Tümü</button>
            <button className={filter === "quick" ? "active" : ""} onClick={() => setFilter("quick")} type="button">Hızlı</button>
          </div>
        </div>

        {visibleItems.length === 0 ? (
          <div className="popular-empty">Bu filtrede gösterilecek tarif yok.</div>
        ) : (
          <div className="popular-grid">
            {visibleItems.map((recipe, index) => (
              <PopularCard key={recipe.id} recipe={recipe} rank={index + 1} onRefresh={load} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function PodiumCard({ recipe, rank, size }: { recipe: PopularRecipe; rank: 1 | 2 | 3; size: "winner" | "side" }) {
  const photo = getRecipePhoto(recipe, size === "winner" ? 720 : 560, size === "winner" ? 540 : 420);
  return (
    <Link to={`/recipes/${recipe.id}`} className={`popular-podium-card rank-${rank} ${size}`}>
      <span className="popular-rank">{rank}</span>
      <div className="popular-podium-image"><img src={photo} alt={recipe.title} loading="lazy" /></div>
      <h3>{recipe.title}</h3>
      <div className="popular-score-row">
        <span><span className="material-symbols-outlined filled" aria-hidden="true">favorite</span>{formatCount(recipe.favorite_count)}</span>
        <span><span className="material-symbols-outlined filled" aria-hidden="true">bookmark</span>{formatCount(recipe.save_count)}</span>
      </div>
    </Link>
  );
}

function PopularCard({ recipe, rank, onRefresh }: { recipe: PopularRecipe; rank: number; onRefresh: () => void }) {
  const photo = getRecipePhoto(recipe, 640, 480);
  const difficulty = recipe.difficulty ? DIFFICULTY_LABEL[recipe.difficulty] || recipe.difficulty : "Kolay";
  const isEasy = recipe.difficulty !== "medium" && recipe.difficulty !== "hard";

  async function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    try {
      const res = await api<{ favorited: boolean }>("POST", `/recipes/${recipe.id}/favorite`);
      toast(res.favorited ? "Favorilere eklendi" : "Favorilerden çıkarıldı");
      onRefresh();
    } catch (error: any) { toastError("Hata", error.message); }
  }

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    try {
      const res = await api<{ saved: boolean }>("POST", `/recipes/${recipe.id}/save`);
      toast(res.saved ? "Kaydedildi" : "Kayıt kaldırıldı");
      onRefresh();
    } catch (error: any) { toastError("Hata", error.message); }
  }

  return (
    <article className="popular-card">
      <div className="popular-card-image">
        <Link to={`/recipes/${recipe.id}`} className="popular-image-link">
          <img src={photo} alt={recipe.title} loading="lazy" />
        </Link>
        <span className={`popular-difficulty ${isEasy ? "easy" : "medium"}`}>
          <span className="material-symbols-outlined" aria-hidden="true">{isEasy ? "bolt" : "trending_up"}</span>
          {difficulty}
        </span>
        <button className="popular-save" onClick={handleSave} title="Kaydet" type="button">
          <span className="material-symbols-outlined" aria-hidden="true">bookmark</span>
        </button>
      </div>
      <div className="popular-card-body">
        <div className="popular-card-rank">#{rank}</div>
        <Link to={`/recipes/${recipe.id}`}><h3>{recipe.title}</h3></Link>
        <div className="popular-card-meta">
          <span><span className="material-symbols-outlined" aria-hidden="true">schedule</span>{recipe.cooking_time || 0}dk</span>
          <span><span className="material-symbols-outlined" aria-hidden="true">group</span>{recipe.serving_count || 1} kişi</span>
        </div>
        <div className="popular-card-footer">
          <div className="popular-card-stats">
            <button onClick={handleFavorite} title="Favorile" type="button">
              <span className="material-symbols-outlined" aria-hidden="true">favorite</span>
              {formatCount(recipe.favorite_count)}
            </button>
            <span><span className="material-symbols-outlined" aria-hidden="true">bookmark</span>{formatCount(recipe.save_count)}</span>
          </div>
          <Link to={`/recipes/${recipe.id}`} className="popular-view">Gör</Link>
        </div>
      </div>
    </article>
  );
}

function formatCount(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return String(value);
}
