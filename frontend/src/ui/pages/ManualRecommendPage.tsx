import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import RecipeCard, { RecipeCardData } from "../components/RecipeCard";
import Spinner, { PageLoader } from "../components/Spinner";
import { toastError } from "../components/Toast";

type Ingredient = { id: number; name: string; category_id: number | null; unit_type: string };
type Category = { id: number; name: string };
type RecItem = RecipeCardData & {
  recipeId: number;
  matchScore: number;
  matchedIngredients: string[];
  missingIngredients: string[];
  favoriteCount: number;
  saveCount: number;
};
type Selected = Record<number, { quantity: number; unit: string }>;
const PAGE_SIZE = 10;

export default function ManualRecommendPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Selected>({});
  const [items, setItems] = useState<RecItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openCats, setOpenCats] = useState<Set<number>>(new Set());

  useEffect(() => {
    Promise.all([
      api<{ items: Ingredient[] }>("GET", "/ingredients"),
      api<{ items: Category[] }>("GET", "/ingredients/categories"),
    ])
      .then(([a, b]) => {
        setIngredients(a.items);
        setCategories(b.items);
        setOpenCats(new Set());
      })
      .catch((e) => toastError("Yükleme Hatası", e.message))
      .finally(() => setInitLoading(false));
  }, []);

  const deferredSearch = useDeferredValue(search);

  const byCat = useMemo(() => {
    const map = new Map<number, Ingredient[]>();
    const q = deferredSearch.trim().toLocaleLowerCase("tr-TR");
    ingredients.forEach((i) => {
      if (q && !i.name.toLocaleLowerCase("tr-TR").includes(q)) return;
      const k = i.category_id || 0;
      const list = map.get(k);
      if (list) list.push(i);
      else map.set(k, [i]);
    });
    return map;
  }, [ingredients, deferredSearch]);

  const toggle = useCallback((ing: Ingredient) => {
    setSelected((s) => {
      const next = { ...s };
      if (next[ing.id]) delete next[ing.id];
      else next[ing.id] = { quantity: 1, unit: ing.unit_type || "adet" };
      return next;
    });
  }, []);

  const toggleCat = useCallback((id: number) => {
    setOpenCats((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const updateSelected = useCallback((id: number, patch: Partial<{ quantity: number; unit: string }>) => {
    setSelected((s) => {
      const current = s[id];
      if (!current) return s;
      return { ...s, [id]: { ...current, ...patch } };
    });
  }, []);

  async function recommend() {
    setLoading(true);
    setVisibleCount(PAGE_SIZE);
    try {
      const payload = {
        ingredients: Object.entries(selected).map(([id, v]) => ({ ingredientId: Number(id), quantity: v.quantity, unit: v.unit })),
      };
      const out = await api<{ items: RecItem[] }>("POST", "/recommendations/by-ingredients", payload);
      setItems(out.items.map((x) => ({ ...x, id: x.recipeId, title: x.title, favorite_count: x.favoriteCount, save_count: x.saveCount })));
    } catch (e: any) {
      toastError("Hata", e.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedCount = useMemo(() => Object.keys(selected).length, [selected]);
  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = visibleCount < items.length;
  if (initLoading) return <PageLoader />;

  return (
    <main className="manual-page">
      <section className="manual-main">
        <div className="manual-hero">
          <span>Manuel seçim</span>
          <h1>Malzemelerini seç, uyumlu tarifleri bul.</h1>
          <p>Elindeki ürünleri kategorilere göre işaretle; sistem sana en iyi eşleşmeleri sıralasın.</p>
        </div>
        <div className="manual-layout">
          <aside className="manual-picker">
            <div className="manual-picker-card">
              <div className="manual-picker-head">
                <h2>Malzemeler</h2>
                <span>{selectedCount} seçili</span>
              </div>
              <input className="manual-search" placeholder="Malzeme ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <div className="manual-category-list">
                {categories.map((c) => {
                  const list = byCat.get(c.id) || [];
                  if (list.length === 0 && search) return null;
                  const isOpen = openCats.has(c.id) || !!deferredSearch.trim();
                  return (
                    <div key={c.id} className="manual-category">
                      <button onClick={() => toggleCat(c.id)}>
                        <strong>{c.name}</strong><span>{list.length}</span>
                      </button>
                      {isOpen && (
                        <div className="manual-ingredient-grid">
                          {list.map((i) => (
                            <IngredientCard
                              key={i.id}
                              ingredient={i}
                              picked={selected[i.id]}
                              onToggle={toggle}
                              onUpdate={updateSelected}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button className="manual-submit" onClick={recommend} disabled={loading || selectedCount === 0}>
                {loading ? <><Spinner size="sm" /> Aranıyor...</> : `Tarif Öner (${selectedCount})`}
              </button>
            </div>
          </aside>
          <section className="manual-results">
            {loading ? <PageLoader /> : items.length === 0 ? (
              <div className="manual-empty"><h2>Malzeme seçip öneri getir</h2><p>Soldan seçim yapıp tarif öner butonuna bas.</p></div>
            ) : (
              <>
                <div className="manual-result-head"><h2>{items.length} tarif önerisi</h2><span>{visibleItems.length}/{items.length}</span></div>
                <div className="manual-result-grid">
                  {visibleItems.map((x) => (
                    <RecipeCard key={x.recipeId} recipe={{ ...x, id: x.recipeId, favorite_count: x.favoriteCount, save_count: x.saveCount }} matchScore={x.matchScore} matchedIngredients={x.matchedIngredients} missingIngredients={x.missingIngredients} />
                  ))}
                </div>
                {hasMore && <button className="manual-more" onClick={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, items.length))}>Daha Fazla Göster</button>}
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

const IngredientCard = memo(function IngredientCard({
  ingredient,
  picked,
  onToggle,
  onUpdate,
}: {
  ingredient: Ingredient;
  picked?: { quantity: number; unit: string };
  onToggle: (ingredient: Ingredient) => void;
  onUpdate: (id: number, patch: Partial<{ quantity: number; unit: string }>) => void;
}) {
  return (
    <div className={`manual-ing${picked ? " selected" : ""}`} onClick={() => onToggle(ingredient)}>
      <div>
        <input type="checkbox" checked={!!picked} readOnly />
        <span>{ingredient.name}</span>
      </div>
      {picked && (
        <div className="manual-ing-controls" onClick={(e) => e.stopPropagation()}>
          <input
            type="number"
            min={0}
            value={picked.quantity}
            onChange={(e) => onUpdate(ingredient.id, { quantity: Number(e.target.value) })}
          />
          <input
            value={picked.unit}
            onChange={(e) => onUpdate(ingredient.id, { unit: e.target.value })}
          />
        </div>
      )}
    </div>
  );
});
