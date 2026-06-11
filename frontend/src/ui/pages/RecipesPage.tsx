import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { PageLoader } from "../components/Spinner";
import { toast, toastError } from "../components/Toast";
import { getRecipePhoto } from "../recipePhotos";

type Recipe = {
  id: number;
  title: string;
  description?: string;
  favorite_count: number;
  save_count: number;
  difficulty?: string;
  cooking_time?: number;
  serving_count?: number;
  image_url?: string;
};

const PAGE_SIZE = 12;
const DIFFICULTY_OPTIONS = [
  { value: "", label: "Tüm Zorluklar" },
  { value: "easy", label: "Kolay" },
  { value: "medium", label: "Orta" },
  { value: "hard", label: "Zor" },
];

export default function RecipesPage() {
  const [items, setItems] = useState<Recipe[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [q, setQ] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const skipRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function fetchPage(skip: number, append: boolean) {
    const params = new URLSearchParams({ skip: String(skip), limit: String(PAGE_SIZE) });
    if (q) params.set("q", q);
    if (difficulty) params.set("difficulty", difficulty);
    const setter = append ? setLoadingMore : setLoading;
    setter(true);
    api<{ items: Recipe[]; total: number; has_more: boolean }>("GET", `/recipes?${params}`)
      .then((d) => {
        setItems((prev) => (append ? [...prev, ...d.items] : d.items));
        setTotal(d.total);
        setHasMore(d.has_more);
        skipRef.current = skip + d.items.length;
      })
      .catch((e) => setErr(e.message))
      .finally(() => setter(false));
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      skipRef.current = 0;
      fetchPage(0, false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, difficulty]); // eslint-disable-line react-hooks/exhaustive-deps

  function reload() {
    skipRef.current = 0;
    fetchPage(0, false);
  }

  return (
    <main className="recipes-page">
      <section className="recipes-main">
        <div className="recipes-hero">
          <span>Tüm Tarifler</span>
          <h1>Bugünün lezzet listesini keşfet.</h1>
          <p>Arama, zorluk filtresi ve hızlı aksiyonlarla tarifleri rahatça tara.</p>
        </div>

        <div className="recipes-filter-card">
          <div className="recipes-search">
            <span className="material-symbols-outlined" aria-hidden="true">search</span>
            <input placeholder="Tarif ara..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="recipes-filter-actions">
            <select className="recipes-select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              {DIFFICULTY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="recipes-total">{total} tarif</div>
          </div>
        </div>

        {err && <div className="error" style={{ marginTop: 12 }}>{err}</div>}

        {loading ? (
          <PageLoader />
        ) : items.length === 0 ? (
          <div className="recipes-empty">Tarif bulunamadı. Farklı bir arama deneyin.</div>
        ) : (
          <>
            <div className="recipes-grid">
              {items.map((recipe) => (
                <RecipeTile key={recipe.id} recipe={recipe} onRefresh={reload} />
              ))}
            </div>
            {hasMore && (
              <button className="recipes-more" disabled={loadingMore} onClick={() => fetchPage(skipRef.current, true)}>
                {loadingMore ? "Yükleniyor..." : "Daha Fazla Göster"}
              </button>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function RecipeTile({ recipe, onRefresh }: { recipe: Recipe; onRefresh: () => void }) {
  const photo = getRecipePhoto(recipe, 640, 480);

  async function favorite(e: React.MouseEvent) {
    e.preventDefault();
    try {
      await api("POST", `/recipes/${recipe.id}/favorite`);
      toast("Favorilere eklendi");
      onRefresh();
    } catch (error: any) { toastError("Hata", error.message); }
  }

  async function save(e: React.MouseEvent) {
    e.preventDefault();
    try {
      await api("POST", `/recipes/${recipe.id}/save`);
      toast("Kaydedildi");
      onRefresh();
    } catch (error: any) { toastError("Hata", error.message); }
  }

  return (
    <article className="recipes-card">
      <Link to={`/recipes/${recipe.id}`} className="recipes-card-image">
        <img src={photo} alt={recipe.title} loading="lazy" />
        {recipe.difficulty && <span>{recipe.difficulty === "easy" ? "Kolay" : recipe.difficulty === "medium" ? "Orta" : "Zor"}</span>}
      </Link>
      <div className="recipes-card-body">
        <Link to={`/recipes/${recipe.id}`}><h3>{recipe.title}</h3></Link>
        <p>{recipe.description || "Tarif detaylarını görüntüleyin."}</p>
        <div className="recipes-card-meta">
          <span>{recipe.cooking_time || 0} dk</span>
          <span>{recipe.serving_count || 1} kişi</span>
        </div>
        <div className="recipes-card-footer">
          <div><button onClick={favorite}>♡ {recipe.favorite_count}</button><button onClick={save}>↧ {recipe.save_count}</button></div>
          <Link to={`/recipes/${recipe.id}`}>Gör</Link>
        </div>
      </div>
    </article>
  );
}
