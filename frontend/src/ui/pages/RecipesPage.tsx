import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { toast, toastError } from "../components/Toast";
import { getRecipePhoto } from "../recipePhotos";

type Recipe = {
  id: number; title: string; description?: string;
  favorite_count: number; save_count: number; difficulty?: string;
  cooking_time?: number; serving_count?: number; image_url?: string;
};

const PAGE_SIZE = 12;
const DIFFICULTY_OPTIONS = [
  { value: "", label: "Tüm Zorluklar" },
  { value: "easy", label: "Kolay" },
  { value: "medium", label: "Orta" },
  { value: "hard", label: "Zor" },
];

const DIFF_LABEL: Record<string, string> = { easy: "Kolay", medium: "Orta", hard: "Zor" };

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

  function reload() { skipRef.current = 0; fetchPage(0, false); }

  return (
    <div className="pb-20">
      <main className="pt-8 max-w-7xl mx-auto px-5 md:px-16">

        {/* Hero */}
        <section className="mb-8">
          <span className="text-label-caps font-semibold text-secondary tracking-widest uppercase mb-2 block">Mutfak Koleksiyonu</span>
          <h1 className="text-display-lg-mobile md:text-display-lg font-bold text-on-surface tracking-tight mb-3">
            Bugünün lezzet listesini keşfet.
          </h1>
          <p className="text-on-surface-variant text-body-lg max-w-2xl">
            Arama, zorluk filtresi ve hızlı aksiyonlarla tarifleri rahatça tara.
          </p>
        </section>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-outline-variant/30 p-4 mb-8 flex flex-col sm:flex-row gap-3 ambient-shadow">
          <div className="relative flex-grow">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl">search</span>
            <input
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm placeholder:text-outline outline-none focus:ring-1 focus:ring-primary"
              placeholder="Tarif ara..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            {DIFFICULTY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="flex items-center px-4 py-2 bg-primary-fixed/40 rounded-xl text-xs font-bold text-primary whitespace-nowrap">
            {total} tarif
          </div>
        </div>

        {err && (
          <div className="mb-6 px-4 py-3 bg-error-container text-on-error-container rounded-xl text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>{err}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="spinner spinner-primary" style={{ width: 36, height: 36 }} />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <span className="material-symbols-outlined text-4xl text-outline">search_off</span>
            <p className="text-on-surface-variant">Tarif bulunamadı. Farklı bir arama deneyin.</p>
            <Link to="/recommend/manual" className="bg-primary text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-primary-container transition-all">
              AI Önerisi Al
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {items.map((recipe) => (
                <RecipeTile key={recipe.id} recipe={recipe} onRefresh={reload} />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  className="flex items-center gap-2 text-primary font-semibold hover:underline disabled:opacity-50"
                  disabled={loadingMore}
                  onClick={() => fetchPage(skipRef.current, true)}
                >
                  {loadingMore ? <><span className="spinner" />Yükleniyor…</> : <>Daha Fazla Göster <span className="material-symbols-outlined">expand_more</span></>}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="culina-footer mt-12">
        <div className="culina-footer-inner">
          <span className="font-bold text-primary">Recipe AI</span>
          <p className="text-xs text-on-surface-variant opacity-50">© 2024 Recipe AI. Seçkin Mutfak Vizyoneri.</p>
        </div>
      </footer>
    </div>
  );
}

function RecipeTile({ recipe, onRefresh }: { recipe: Recipe; onRefresh: () => void }) {
  const photo = getRecipePhoto(recipe, 640, 480);

  async function favorite(e: React.MouseEvent) {
    e.preventDefault();
    try { await api("POST", `/recipes/${recipe.id}/favorite`); toast("Favorilere eklendi"); onRefresh(); }
    catch (error: any) { toastError("Hata", error.message); }
  }

  async function save(e: React.MouseEvent) {
    e.preventDefault();
    try { await api("POST", `/recipes/${recipe.id}/save`); toast("Kaydedildi"); onRefresh(); }
    catch (error: any) { toastError("Hata", error.message); }
  }

  return (
    <article className="recipe-card">
      <Link to={`/recipes/${recipe.id}`} className="recipe-card-image block">
        <img src={photo} alt={recipe.title} loading="lazy" />
        {recipe.difficulty && (
          <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/40 text-white backdrop-blur-sm">
            {DIFF_LABEL[recipe.difficulty] || recipe.difficulty}
          </span>
        )}
      </Link>
      <div className="recipe-card-body">
        <Link to={`/recipes/${recipe.id}`}>
          <h3 className="font-semibold text-on-surface leading-snug mb-2 hover:text-primary transition-colors">{recipe.title}</h3>
        </Link>
        {recipe.description && (
          <p className="text-xs text-on-surface-variant mb-2 line-clamp-2">{recipe.description}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-on-surface-variant mb-3">
          {recipe.cooking_time ? <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">schedule</span>{recipe.cooking_time} dk</span> : null}
          {recipe.serving_count ? <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">group</span>{recipe.serving_count} kişi</span> : null}
        </div>
        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-outline-variant/20">
          <button className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-secondary transition-colors" onClick={favorite}>
            <span className="material-symbols-outlined text-sm">favorite</span>{recipe.favorite_count}
          </button>
          <button className="flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary transition-colors" onClick={save}>
            <span className="material-symbols-outlined text-sm">bookmark</span>{recipe.save_count}
          </button>
          <Link to={`/recipes/${recipe.id}`} className="ml-auto text-xs font-semibold text-primary hover:underline">Gör</Link>
        </div>
      </div>
    </article>
  );
}
