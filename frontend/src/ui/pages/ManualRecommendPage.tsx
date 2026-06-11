import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { RecipeCardData } from "../components/RecipeCard";
import { toastError } from "../components/Toast";
import { getRecipePhoto } from "../recipePhotos";
import { recordSearchTerm } from "../searchInsights";

type Ingredient = { id: number; name: string; category_id: number | null; unit_type: string };
type Category = { id: number; name: string };
type RecItem = RecipeCardData & {
  recipeId: number; matchScore: number;
  matchedIngredients: string[]; missingIngredients: string[];
  favoriteCount: number; saveCount: number;
};
type Selected = Record<number, { quantity: number; unit: string }>;
const PAGE_SIZE = 10;

const CAT_ICONS: Record<string, string> = {
  "Sebzeler": "yard", "Meyveler": "nutrition", "Baharatlar": "eco",
  "Bakliyat": "grain", "Süt Ürünleri": "egg", "Etler": "dinner_dining",
  "Deniz Ürünleri": "set_meal", "Tahıllar": "grass", "Yağlar": "water_drop",
};

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
  const [activeFilter, setActiveFilter] = useState("Tümü");

  useEffect(() => {
    Promise.all([
      api<{ items: Ingredient[] }>("GET", "/ingredients"),
      api<{ items: Category[] }>("GET", "/ingredients/categories"),
    ])
      .then(([a, b]) => { setIngredients(a.items); setCategories(b.items); })
      .catch((e) => toastError("Yükleme Hatası", e.message))
      .finally(() => setInitLoading(false));
  }, []);

  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    recordSearchTerm(deferredSearch, "ingredient");
  }, [deferredSearch]);

  const byCat = useMemo(() => {
    const map = new Map<number, Ingredient[]>();
    const q = deferredSearch.trim().toLocaleLowerCase("tr-TR");
    ingredients.forEach((i) => {
      if (q && !i.name.toLocaleLowerCase("tr-TR").includes(q)) return;
      const k = i.category_id || 0;
      const list = map.get(k);
      if (list) list.push(i); else map.set(k, [i]);
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
    setLoading(true); setVisibleCount(PAGE_SIZE);
    try {
      Object.keys(selected).forEach((id) => {
        const name = ingredients.find((item) => item.id === Number(id))?.name;
        if (name) recordSearchTerm(name, "recommendation");
      });
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
  const selectedIngNames = useMemo(() => Object.keys(selected).map(id => ingredients.find(i => i.id === Number(id))?.name ?? ""), [selected, ingredients]);
  const matchPotential = Math.min(100, selectedCount * 8 + (selectedCount > 5 ? 20 : 0));

  const filters = ["Tümü", "Stokta", "Mevsimlik", "Sağlıklı", "Temel"];

  if (initLoading) return (
    <div className="page-loader">
      <span className="spinner spinner-primary" style={{ width: 36, height: 36 }} />
    </div>
  );

  return (
    <div className="pb-16">
      <main className="pt-8 pb-8 max-w-7xl mx-auto px-5 md:px-16 grid grid-cols-12 gap-6 min-h-[calc(100vh-8rem)]">

        {/* Left Panel */}
        <aside className="col-span-12 md:col-span-3 flex flex-col gap-5">
          <div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight mb-1">Kitchen Lab</h1>
            <p className="text-sm text-on-surface-variant opacity-70">Profesyonel Malzeme Yönetimi</p>
          </div>

          {/* Category Stats */}
          <div className="bg-white rounded-2xl border border-outline-variant p-5 ambient-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-outline">Kategori Kapsamı</h3>
              <span className="text-xs font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                {categories.length} kategori
              </span>
            </div>
            <div className="space-y-3">
              {categories.slice(0, 4).map((c) => {
                const count = byCat.get(c.id)?.length || 0;
                const icon = CAT_ICONS[c.name] || "eco";
                return (
                  <div key={c.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-transparent hover:border-outline-variant transition-all cursor-pointer"
                    onClick={() => toggleCat(c.id)}>
                    <div className="relative w-9 h-9 flex-shrink-0">
                      <svg className="w-full h-full" style={{ transform: "rotate(-90deg)" }} viewBox="0 0 36 36">
                        <circle className="text-outline-variant" cx="18" cy="18" fill="transparent" r="15" stroke="currentColor" strokeWidth="3" />
                        <circle className="text-primary" cx="18" cy="18" fill="transparent" r="15" stroke="currentColor"
                          strokeDasharray="100" strokeDashoffset={Math.max(10, 100 - count * 2)} strokeLinecap="round" strokeWidth="3" />
                      </svg>
                      <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-xs text-primary">
                        {icon}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold">{c.name}</div>
                      <div className="text-[10px] text-on-surface-variant">{count} malzeme</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recently selected */}
          {selectedIngNames.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-outline px-1">Seçilenler</h3>
              <div className="flex flex-wrap gap-2">
                {selectedIngNames.slice(0, 6).map((name) => (
                  <span key={name} className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Center: Ingredient Grid */}
        <section className="col-span-12 md:col-span-6 flex flex-col gap-5">
          {/* Search & Filter */}
          <div className="bg-white rounded-2xl border border-outline-variant p-4 ambient-shadow flex flex-col gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl">search</span>
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl focus:ring-1 focus:ring-primary text-sm placeholder:text-outline outline-none"
                placeholder="Malzeme ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {filters.map((f) => (
                <button key={f}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${activeFilter === f ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant hover:bg-outline-variant/30"}`}
                  onClick={() => setActiveFilter(f)}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredient Cards by Category */}
          <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar" style={{ maxHeight: "60vh" }}>
            {categories.map((c) => {
              const list = byCat.get(c.id) || [];
              if (list.length === 0) return null;
              const isOpen = openCats.has(c.id) || !!deferredSearch.trim();
              const icon = CAT_ICONS[c.name] || "eco";
              const selectedInCat = list.filter((i) => selected[i.id]).length;

              return (
                <div key={c.id} className="bg-white rounded-2xl border border-outline-variant p-4 ambient-shadow">
                  <button
                    className="w-full flex items-center justify-between mb-0"
                    onClick={() => toggleCat(c.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">{icon}</span>
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-on-surface text-sm">{c.name}</div>
                        <div className="text-xs text-on-surface-variant">{list.length} malzeme{selectedInCat > 0 && ` · ${selectedInCat} seçili`}</div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-outline-variant text-sm transition-transform" style={{ transform: isOpen ? "rotate(90deg)" : "none" }}>
                      arrow_forward_ios
                    </span>
                  </button>

                  {isOpen && (
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-outline-variant/30">
                      {list.map((ing) => (
                        <IngredientCard key={ing.id} ingredient={ing} picked={selected[ing.id]} onToggle={toggle} onUpdate={updateSelected} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Right: AI Analysis */}
        <aside className="col-span-12 md:col-span-3 flex flex-col gap-5">
          <div className="bg-white rounded-2xl border border-outline-variant p-6 ambient-shadow sticky top-24">
            {/* AI Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <div>
                <h3 className="font-bold text-sm">AI Analizi</h3>
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Hazır</p>
              </div>
            </div>

            {/* Match percentage */}
            <div className="text-center p-4 bg-surface-container rounded-xl border border-outline-variant/30 mb-5">
              <div className="text-4xl font-extrabold text-primary mb-1">{matchPotential}%</div>
              <div className="text-xs font-semibold text-on-surface">Tarif Eşleşme Potansiyeli</div>
              <div className="w-full bg-outline-variant h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${matchPotential}%` }} />
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3 mb-5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">Seçilen Malzeme</span>
                <span className="font-bold">{selectedCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">Beslenme Dengesi</span>
                <span className="font-bold text-secondary">{selectedCount > 5 ? "Optimal" : selectedCount > 2 ? "İyi" : "Düşük"}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">Karmaşıklık</span>
                <span className="font-bold">{selectedCount > 8 ? "Yüksek" : "Orta"}</span>
              </div>
            </div>

            {/* CTA */}
            <button
              className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-primary-container transition-all active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-50"
              disabled={loading || selectedCount === 0}
              onClick={recommend}
            >
              {loading ? (
                <><span className="spinner" /> Aranıyor…</>
              ) : (
                <><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>Tarif Öner</>
              )}
            </button>
            {selectedCount === 0 && (
              <p className="text-[10px] text-center text-on-surface-variant mt-2">Sol panelden malzeme seçin</p>
            )}
          </div>
        </aside>
      </main>

      {/* Results */}
      {(items.length > 0 || loading) && (
        <section className="max-w-7xl mx-auto px-5 md:px-16 mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <span className="spinner spinner-primary" style={{ width: 36, height: 36 }} />
                <p className="text-on-surface-variant text-sm">Tarif eşleşmeleri hesaplanıyor…</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-headline-md font-semibold text-on-surface">{items.length} Tarif Önerisi</h2>
                <span className="text-xs text-on-surface-variant">{Math.min(visibleCount, items.length)}/{items.length} gösteriliyor</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.slice(0, visibleCount).map((x) => (
                  <ResultCard key={x.recipeId} item={x} />
                ))}
              </div>
              {visibleCount < items.length && (
                <div className="flex justify-center mt-8">
                  <button
                    className="flex items-center gap-2 text-primary font-semibold hover:underline"
                    onClick={() => setVisibleCount((c) => Math.min(c + PAGE_SIZE, items.length))}
                  >
                    Daha Fazla Göster <span className="material-symbols-outlined">expand_more</span>
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Footer */}
      <footer className="culina-footer mt-8">
        <div className="culina-footer-inner">
          <span className="font-bold text-primary">Recipe AI</span>
          <p className="text-xs text-on-surface-variant opacity-50">© 2024 Laboratory Edition.</p>
        </div>
      </footer>
    </div>
  );
}

const IngredientCard = memo(function IngredientCard({
  ingredient, picked, onToggle, onUpdate,
}: {
  ingredient: Ingredient;
  picked?: { quantity: number; unit: string };
  onToggle: (ingredient: Ingredient) => void;
  onUpdate: (id: number, patch: Partial<{ quantity: number; unit: string }>) => void;
}) {
  return (
    <div
      className={`p-3 rounded-xl border cursor-pointer transition-all ${picked ? "border-primary bg-primary-fixed/30" : "border-outline-variant/50 bg-surface-container-low hover:border-primary/30"}`}
      onClick={() => onToggle(ingredient)}
    >
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${picked ? "bg-primary border-primary" : "border-outline-variant"}`}>
          {picked && <span className="material-symbols-outlined text-white" style={{ fontSize: 11 }}>check</span>}
        </div>
        <span className="text-xs font-medium text-on-surface truncate">{ingredient.name}</span>
      </div>
      {picked && (
        <div className="grid grid-cols-2 gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="number" min={0}
            value={picked.quantity}
            onChange={(e) => onUpdate(ingredient.id, { quantity: Number(e.target.value) })}
            className="w-full border border-outline-variant/50 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary bg-white"
          />
          <input
            value={picked.unit}
            onChange={(e) => onUpdate(ingredient.id, { unit: e.target.value })}
            className="w-full border border-outline-variant/50 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary bg-white"
          />
        </div>
      )}
    </div>
  );
});

function ResultCard({ item }: { item: RecItem }) {
  const photo = getRecipePhoto({ id: item.recipeId, title: item.title, image_url: item.image_url } as any, 640, 420);
  return (
    <Link to={`/recipes/${item.recipeId}`} className="recipe-card block">
      <div className="recipe-card-image">
        <img src={photo} alt={item.title} loading="lazy" />
        <span className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
          %{Math.round(item.matchScore)} eşleşme
        </span>
      </div>
      <div className="recipe-card-body">
        <h3 className="font-semibold text-on-surface mb-2 leading-snug">{item.title}</h3>
        <div className="flex flex-wrap gap-1 mb-3">
          {item.matchedIngredients.slice(0, 3).map((name) => (
            <span key={name} className="bg-primary-fixed/50 text-on-primary-fixed text-xs px-2 py-0.5 rounded-full font-medium">{name}</span>
          ))}
          {item.missingIngredients.length > 0 && (
            <span className="bg-secondary-fixed/50 text-on-secondary-fixed text-xs px-2 py-0.5 rounded-full font-medium">
              +{item.missingIngredients.length} eksik
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-auto">
          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">favorite</span>{item.favoriteCount}</span>
          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">bookmark</span>{item.saveCount}</span>
        </div>
      </div>
    </Link>
  );
}
