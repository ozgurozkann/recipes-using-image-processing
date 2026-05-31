import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import Toast from "../components/Toast";

type Ingredient = { id: number; name: string; unit_type: string; category_id: number | null };
type Category = { id: number; name: string };

type RecipeCreate = {
  title: string;
  description: string;
  instructions: string;
  cooking_time: number;
  serving_count: number;
  difficulty: string;
  category_id: number | null;
  image_url: string;
  ingredients: { ingredient_id: number; quantity: number; unit: string }[];
};

export default function AddRecipePage() {
  const [toast, setToast] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [cooking_time, setCookingTime] = useState(20);
  const [serving_count, setServingCount] = useState(2);
  const [difficulty, setDifficulty] = useState("easy");
  const [category_id, setCategoryId] = useState<number | null>(null);
  const [image_url, setImageUrl] = useState("");

  const [selected, setSelected] = useState<Record<number, { quantity: number; unit: string }>>({});

  useEffect(() => {
    Promise.all([api<{ items: Ingredient[] }>("GET", "/ingredients"), api<{ items: Category[] }>("GET", "/ingredients/categories")])
      .then(([a, b]) => {
        setIngredients(a.items);
        setCategories(b.items);
      })
      .catch((e) => setErr(e.message));
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<number, Ingredient[]>();
    ingredients.forEach((i) => {
      const k = i.category_id || 0;
      const arr = map.get(k) || [];
      arr.push(i);
      map.set(k, arr);
    });
    return map;
  }, [ingredients]);

  function toggleIngredient(id: number, unitType: string) {
    setSelected((s) => {
      const next = { ...s };
      if (next[id]) delete next[id];
      else next[id] = { quantity: 1, unit: unitType || "adet" };
      return next;
    });
  }

  async function submit() {
    setErr(null);
    const payload: RecipeCreate = {
      title,
      description,
      instructions,
      cooking_time,
      serving_count,
      difficulty,
      category_id,
      image_url,
      ingredients: Object.entries(selected).map(([id, v]) => ({
        ingredient_id: Number(id),
        quantity: v.quantity,
        unit: v.unit
      }))
    };
    try {
      await api("POST", "/recipes", payload);
      setToast("Tarif eklendi. Admin değilsen onay bekleyebilir.");
      setTitle("");
      setDescription("");
      setInstructions("");
      setSelected({});
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <div className="grid">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <div className="card" style={{ gridColumn: "span 5" }}>
        <h2>Tarif Ekle</h2>
        {err && <div className="error">{err}</div>}

        <div className="field">
          <label className="muted">Başlık</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: Tavuklu Sebze" />
        </div>
        <div className="field">
          <label className="muted">Açıklama</label>
          <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
        <div className="field">
          <label className="muted">Hazırlanış adımları</label>
          <textarea className="input" value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={7} placeholder="Her adımı yeni satıra yaz." />
        </div>

        <div className="grid" style={{ marginTop: 8 }}>
          <div style={{ gridColumn: "span 6" }} className="field">
            <label className="muted">Süre (dk)</label>
            <input className="input" type="number" value={cooking_time} onChange={(e) => setCookingTime(Number(e.target.value))} />
          </div>
          <div style={{ gridColumn: "span 6" }} className="field">
            <label className="muted">Porsiyon</label>
            <input className="input" type="number" value={serving_count} onChange={(e) => setServingCount(Number(e.target.value))} />
          </div>
        </div>

        <div className="grid" style={{ marginTop: 8 }}>
          <div style={{ gridColumn: "span 6" }} className="field">
            <label className="muted">Zorluk</label>
            <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="easy">Kolay</option>
              <option value="medium">Orta</option>
              <option value="hard">Zor</option>
            </select>
          </div>
          <div style={{ gridColumn: "span 6" }} className="field">
            <label className="muted">Kategori</label>
            <select className="input" value={category_id ?? ""} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label className="muted">Görsel URL (opsiyonel)</label>
          <input className="input" value={image_url} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
        </div>

        <button className="btn primary" onClick={submit} style={{ marginTop: 12 }}>
          Kaydet
        </button>
      </div>

      <div className="card" style={{ gridColumn: "span 7" }}>
        <h3>Malzeme Seç</h3>
        <div className="muted">Seçtiklerinin miktarını düzenleyebilirsin.</div>
        {categories.map((c) => (
          <div key={c.id} style={{ marginTop: 12 }}>
            <strong>{c.name}</strong>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10, marginTop: 8 }}>
              {(grouped.get(c.id) || []).map((i) => {
                const picked = selected[i.id];
                return (
                  <div key={i.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 10, background: "var(--panel2)" }}>
                    <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input type="checkbox" checked={!!picked} onChange={() => toggleIngredient(i.id, i.unit_type)} />
                      <span>{i.name}</span>
                      <span className="badge" style={{ marginLeft: "auto" }}>
                        {i.unit_type}
                      </span>
                    </label>
                    {picked && (
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <input
                          className="input"
                          type="number"
                          value={picked.quantity}
                          onChange={(e) =>
                            setSelected((s) => ({ ...s, [i.id]: { ...s[i.id], quantity: Number(e.target.value) } }))
                          }
                          style={{ flex: 1 }}
                        />
                        <input
                          className="input"
                          value={picked.unit}
                          onChange={(e) => setSelected((s) => ({ ...s, [i.id]: { ...s[i.id], unit: e.target.value } }))}
                          style={{ width: 120 }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

