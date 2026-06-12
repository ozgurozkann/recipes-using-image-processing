import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { toast, toastError } from "../components/Toast";
import { getRecipePhoto } from "../recipePhotos";
import { recordSearchTerm } from "../searchInsights";
import { useLanguage } from "../i18n";

type Recipe = {
  id: number; title: string; description?: string;
  favorite_count: number; save_count: number; difficulty?: string;
  cooking_time?: number; serving_count?: number; image_url?: string;
  avg_rating?: number | null; review_count?: number | null;
};

const PAGE_SIZE = 12;

export default function RecipesPage() {
  const { lang, t } = useLanguage();

  const DIFFICULTY_OPTIONS = [
    { value: "", label: t("diff_all") },
    { value: "easy", label: t("diff_easy") },
    { value: "medium", label: t("diff_medium") },
    { value: "hard", label: t("diff_hard") },
  ];
  const [items, setItems] = useState<Recipe[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [q, setQ] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [maxTime, setMaxTime] = useState(0);
  const [sort, setSort] = useState("popular");
  const skipRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function fetchPage(skip: number, append: boolean) {
    const params = new URLSearchParams({ skip: String(skip), limit: String(PAGE_SIZE) });
    if (q) params.set("q", q);
    if (difficulty) params.set("difficulty", difficulty);
    if (maxTime > 0) params.set("max_time", String(maxTime));
    if (sort !== "popular") params.set("sort", sort);
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
      recordSearchTerm(q, "recipe");
      skipRef.current = 0;
      fetchPage(0, false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, difficulty, maxTime, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  function reload() { skipRef.current = 0; fetchPage(0, false); }

  return (
    <div className="pb-20">
      <main className="pt-8 max-w-7xl mx-auto px-5 md:px-16">

        {/* Hero */}
        <section className="mb-8">
          <span className="text-label-caps font-semibold text-secondary tracking-widest uppercase mb-2 block">{t("recipes_eyebrow")}</span>
          <h1 className="text-display-lg-mobile md:text-display-lg font-bold text-on-surface tracking-tight mb-3">
            {t("recipes_h1")}
          </h1>
          <p className="text-on-surface-variant text-body-lg max-w-2xl">
            {t("recipes_desc")}
          </p>
        </section>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-outline-variant/30 p-4 mb-8 flex flex-col gap-3 ambient-shadow">
          {/* Row 1: Search + count */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl">search</span>
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl text-sm placeholder:text-outline outline-none focus:ring-1 focus:ring-primary"
                placeholder={t("recipes_search_ph")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="flex items-center px-4 py-2 bg-primary-fixed/40 rounded-xl text-xs font-bold text-primary whitespace-nowrap">
              {total} {lang === "tr" ? "tarif" : "recipes"}
            </div>
          </div>

          {/* Row 2: Dropdowns + time chips */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Difficulty */}
            <select
              className="px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              {DIFFICULTY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {/* Sort */}
            <select
              className="px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="popular">{t("recipes_sort_popular")}</option>
              <option value="newest">{t("recipes_sort_newest")}</option>
              <option value="fastest">{t("recipes_sort_fastest")}</option>
              <option value="rating">{t("recipes_sort_rating")}</option>
            </select>

            {/* Time chips */}
            <div className="flex items-center gap-1.5 ml-1">
              {([0, 15, 30, 60] as const).map((val) => (
                <button
                  key={val}
                  onClick={() => setMaxTime(val)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                    maxTime === val
                      ? "bg-primary text-white border-primary"
                      : "bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  {val === 0 ? t("recipes_time_all") : val === 15 ? t("recipes_time_15") : val === 30 ? t("recipes_time_30") : t("recipes_time_60")}
                </button>
              ))}
            </div>
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
            <p className="text-on-surface-variant">{t("recipes_empty")}</p>
            <Link to="/recommend/manual" className="bg-primary text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-primary-container transition-all">
              {t("recipes_ai_suggest")}
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
                  {loadingMore ? <><span className="spinner" />{t("recipes_loading")}</> : <>{t("recipes_load_more")} <span className="material-symbols-outlined">expand_more</span></>}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="culina-footer mt-12">
        <div className="culina-footer-inner">
          <span className="font-bold text-primary">Recipe AI</span>
          <p className="text-xs text-on-surface-variant opacity-50">{t("recipes_copyright")}</p>
        </div>
      </footer>
    </div>
  );
}

function RecipeTile({ recipe, onRefresh }: { recipe: Recipe; onRefresh: () => void }) {
  const photo = getRecipePhoto(recipe, 640, 480);
  const { t } = useLanguage();
  const diffLabel = (d: string) => ({ easy: t("diff_easy"), medium: t("diff_medium"), hard: t("diff_hard") }[d] ?? d);

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
            {diffLabel(recipe.difficulty)}
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
          {recipe.avg_rating != null && recipe.review_count != null && recipe.review_count > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-amber-500 font-semibold">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              {recipe.avg_rating.toFixed(1)}
              <span className="text-on-surface-variant font-normal">({recipe.review_count})</span>
            </span>
          )}
          <Link to={`/recipes/${recipe.id}`} className="ml-auto text-xs font-semibold text-primary hover:underline">{t("recipes_view")}</Link>
        </div>
      </div>
    </article>
  );
}
