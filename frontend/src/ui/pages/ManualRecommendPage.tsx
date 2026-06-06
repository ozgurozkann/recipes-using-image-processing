import { useEffect, useMemo, useState } from "react";
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
        setOpenCats(new Set(b.items.map((c) => c.id)));
      })
      .catch((e) => toastError("Yükleme Hatası", e.message))
      .finally(() => setInitLoading(false));
  }, []);

  const byCat = useMemo(() => {
    const map = new Map<number, Ingredient[]>();
    const q = search.trim().toLowerCase();
    ingredients.forEach((i) => {
      if (q && !i.name.toLowerCase().includes(q)) return;
      const k = i.category_id || 0;
      map.set(k, [...(map.get(k) || []), i]);
    });
    return map;
  }, [ingredients, search]);

  function toggle(ing: Ingredient) {
    setSelected((s) => {
      const next = { ...s };
      if (next[ing.id]) delete next[ing.id];
      else next[ing.id] = { quantity: 1, unit: ing.unit_type || "adet" };
      return next;
    });
  }

  function toggleCat(id: number) {
    setOpenCats((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function recommend() {
    setLoading(true);
    setVisibleCount(PAGE_SIZE);
    try {
      const payload = {
        ingredients: Object.entries(selected).map(([id, v]) => ({
          ingredientId: Number(id), quantity: v.quantity, unit: v.unit,
        })),
      };
      const out = await api<{ items: RecItem[] }>("POST", "/recommendations/by-ingredients", payload);
      setItems(out.items.map((x) => ({
        ...x, id: x.recipeId, title: x.title,
        favorite_count: x.favoriteCount, save_count: x.saveCount,
      })));
    } catch (e: any) {
      toastError("Hata", e.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedCount = Object.keys(selected).length;
  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;
  if (initLoading) return <PageLoader />;

  return (
    <div>
      <div className="page-hero">
        <h1 className="page-title">🥦 Manuel <span>Malzeme Seçimi</span></h1>
        <p className="page-sub">Elindeki malzemeleri seç, miktarı gir — kişiselleştirilmiş tarif önerilerini al.</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "380px 1fr", alignItems: "start" }}>
        {/* ── Left: Ingredient picker ── */}
        <div style={{ position: "sticky", top: 90 }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontWeight: 700 }}>Malzemeler</h3>
              {selectedCount > 0 && (
                <span className="badge primary">{selectedCount} seçili</span>
              )}
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: 14 }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>🔍</span>
              <input className="input" placeholder="Malzeme ara…" value={search}
                onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 34, paddingTop: 9, paddingBottom: 9 }} />
            </div>

            {/* Category accordion */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 460, overflowY: "auto",
              paddingRight: 4 }}>
              {categories.map((c) => {
                const list = byCat.get(c.id) || [];
                if (list.length === 0 && search) return null;
                const isOpen = openCats.has(c.id);
                return (
                  <div key={c.id}>
                    <button
                      onClick={() => toggleCat(c.id)}
                      style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "8px 10px", borderRadius: "var(--radius-sm)", background: "var(--panel2)",
                        border: "1px solid var(--border)", cursor: "pointer", color: "var(--text)" }}
                    >
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span className="badge">{list.length}</span>
                        <span style={{ color: "var(--muted)", fontSize: 12, transition: "transform 0.2s",
                          transform: isOpen ? "rotate(180deg)" : "none" }}>▼</span>
                      </div>
                    </button>

                    {isOpen && list.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6, paddingLeft: 4 }}>
                        {list.map((i) => {
                          const picked = selected[i.id];
                          return (
                            <div key={i.id} className={`ing-card${picked ? " selected" : ""}`} onClick={() => toggle(i)}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <input type="checkbox" checked={!!picked} readOnly style={{ pointerEvents: "none", accentColor: "var(--primary)" }} />
                                <span style={{ fontSize: 13, fontWeight: 500 }}>{i.name}</span>
                              </div>
                              {picked && (
                                <div style={{ display: "flex", gap: 4, marginTop: 6 }} onClick={(e) => e.stopPropagation()}>
                                  <input className="input" type="number" min={0} value={picked.quantity}
                                    onChange={(e) => setSelected((s) => ({ ...s, [i.id]: { ...s[i.id], quantity: Number(e.target.value) } }))}
                                    style={{ flex: 1, padding: "4px 6px", fontSize: 12 }} />
                                  <input className="input" value={picked.unit}
                                    onChange={(e) => setSelected((s) => ({ ...s, [i.id]: { ...s[i.id], unit: e.target.value } }))}
                                    style={{ width: 56, padding: "4px 6px", fontSize: 12 }} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected summary */}
            {selectedCount > 0 && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Seçilen malzemeler:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {Object.entries(selected).map(([id, v]) => {
                    const ing = ingredients.find((x) => x.id === Number(id));
                    return (
                      <span key={id} className="pill ok" style={{ cursor: "pointer" }}
                        onClick={() => toggle({ id: Number(id), name: "", category_id: null, unit_type: "" } as Ingredient)}>
                        {ing?.name} {v.quantity}{v.unit} ×
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <button className="btn primary btn-lg" onClick={recommend}
              disabled={loading || selectedCount === 0}
              style={{ width: "100%", marginTop: 16, justifyContent: "center" }}>
              {loading ? <><Spinner size="sm" /> Aranıyor…</> : `🔍 Tarif Öner (${selectedCount})`}
            </button>
          </div>
        </div>

        {/* ── Right: Results ── */}
        <div>
          {loading ? (
            <PageLoader />
          ) : items.length === 0 ? (
            <div className="empty card">
              <div className="empty-icon">🍽️</div>
              <div className="empty-title">Malzeme seçip öneri getir</div>
              <div className="empty-sub">Soldan malzeme seç, ardından "Tarif Öner"e tıkla.</div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                  {items.length} Tarif Önerisi
                </h2>
                <span className="badge ok">{visibleItems.length}/{items.length} gösteriliyor</span>
              </div>
              <div className="grid stagger" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", margin: 0 }}>
                {visibleItems.map((x) => (
                  <RecipeCard
                    key={x.recipeId}
                    recipe={{ ...x, id: x.recipeId, favorite_count: x.favoriteCount, save_count: x.saveCount }}
                    matchScore={x.matchScore}
                    matchedIngredients={x.matchedIngredients}
                    missingIngredients={x.missingIngredients}
                  />
                ))}
              </div>
              {hasMore && (
                <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
                  <button
                    className="btn btn-lg"
                    onClick={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, items.length))}
                  >
                    Daha Fazla Göster
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
