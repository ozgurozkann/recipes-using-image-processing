import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

type Ingredient = { id: number; name: string; category_id: number | null; unit_type: string };
type Category = { id: number; name: string };
type RecItem = { recipeId: number; title: string; matchScore: number; matchedIngredients: string[]; missingIngredients: string[] };

export default function ManualRecommendPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [items, setItems] = useState<RecItem[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api<{ items: Ingredient[] }>("GET", "/ingredients"), api<{ items: Category[] }>("GET", "/ingredients/categories")])
      .then(([a, b]) => {
        setIngredients(a.items);
        setCategories(b.items);
      })
      .catch((e) => setErr(e.message));
  }, []);

  const byCat = useMemo(() => {
    const map = new Map<number, Ingredient[]>();
    ingredients.forEach((i) => {
      const k = i.category_id || 0;
      const arr = map.get(k) || [];
      arr.push(i);
      map.set(k, arr);
    });
    return map;
  }, [ingredients]);

  async function recommend() {
    setErr(null);
    const ids = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => Number(k));
    const payload = { ingredients: ids.map((id) => ({ ingredientId: id, quantity: 1, unit: "adet" })) };
    const out = await api<{ items: RecItem[] }>("POST", "/recommendations/by-ingredients", payload);
    setItems(out.items);
  }

  return (
    <div className="grid">
      <div className="card" style={{ gridColumn: "span 5" }}>
        <h2>Manuel Malzeme Seç</h2>
        <div className="muted">Kategori bazlı seçim yap, sonra öneri getir.</div>
        {err && <div className="error" style={{ marginTop: 12 }}>{err}</div>}
        <button className="btn primary" onClick={recommend} style={{ marginTop: 12 }}>
          Öneri getir
        </button>

        {categories.map((c) => (
          <div key={c.id} style={{ marginTop: 14 }}>
            <strong>{c.name}</strong>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginTop: 8 }}>
              {(byCat.get(c.id) || []).map((i) => (
                <label key={i.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: 8, borderRadius: 12, border: "1px solid var(--border)", background: "var(--panel2)" }}>
                  <input type="checkbox" checked={!!selected[i.id]} onChange={(e) => setSelected((s) => ({ ...s, [i.id]: e.target.checked }))} />
                  <span>{i.name}</span>
                  <span className="badge" style={{ marginLeft: "auto" }}>
                    {i.unit_type}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ gridColumn: "span 7" }}>
        <h2>Öneriler</h2>
        <div className="muted">Skor, eşleşen ve eksik malzemeleri gösterir.</div>
        <div style={{ marginTop: 10 }}>
          {items.length === 0 ? (
            <div className="muted">Seçim yapıp “Öneri getir”e bas.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
              {items.map((x) => (
                <div key={x.recipeId} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 12, background: "var(--panel2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <strong>{x.title}</strong>
                    <span className="badge">Skor {x.matchScore}</span>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div className="muted">Eşleşen</div>
                    <div>{(x.matchedIngredients || []).map((n) => <span key={n} className="pill">{n}</span>)}</div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div className="muted">Eksik</div>
                    <div>{(x.missingIngredients || []).map((n) => <span key={n} className="pill">{n}</span>)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
