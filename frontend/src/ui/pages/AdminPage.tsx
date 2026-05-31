import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import Toast from "../components/Toast";

type Me = { id: number; full_name: string; email: string; role: string };
type Recipe = { id: number; title: string; description: string; is_approved: boolean };
type Category = { id: number; name: string };
type Ingredient = { id: number; name: string; category_id: number | null; unit_type: string };

export default function AdminPage() {
  const [toast, setToast] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [me, setMe] = useState<Me | null>(null);
  const [pending, setPending] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const [newCat, setNewCat] = useState("");
  const [newIngName, setNewIngName] = useState("");
  const [newIngCat, setNewIngCat] = useState<number | "">("");
  const [newIngUnit, setNewIngUnit] = useState("adet");

  async function refresh() {
    setErr(null);
    try {
      const [meOut, pendOut, catOut, ingOut] = await Promise.all([
        api<Me>("GET", "/auth/me"),
        api<{ items: Recipe[] }>("GET", "/admin/pending-recipes"),
        api<{ items: Category[] }>("GET", "/ingredients/categories"),
        api<{ items: Ingredient[] }>("GET", "/ingredients")
      ]);
      setMe(meOut);
      setPending(pendOut.items);
      setCategories(catOut.items);
      setIngredients(ingOut.items);
    } catch (e: any) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const roleOk = me?.role === "admin";

  async function approve(id: number) {
    await api("PUT", `/admin/recipes/${id}/approve`);
    setToast("Onaylandı");
    await refresh();
  }
  async function reject(id: number) {
    await api("PUT", `/admin/recipes/${id}/reject`);
    setToast("Reddedildi");
    await refresh();
  }

  async function createCategory() {
    if (!newCat.trim()) return;
    await api("POST", "/ingredients/categories", { name: newCat.trim() });
    setNewCat("");
    setToast("Kategori eklendi");
    await refresh();
  }

  async function createIngredient() {
    if (!newIngName.trim()) return;
    await api("POST", "/ingredients", {
      name: newIngName.trim().toLowerCase(),
      category_id: newIngCat === "" ? null : newIngCat,
      unit_type: newIngUnit
    });
    setNewIngName("");
    setToast("Malzeme eklendi");
    await refresh();
  }

  const catNameById = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  return (
    <div className="grid">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="card" style={{ gridColumn: "span 12" }}>
        <h2>Admin Paneli</h2>
        <div className="muted">Onay bekleyen tarifler ve malzeme/kategori yönetimi.</div>
        {err && <div className="error" style={{ marginTop: 12 }}>{err}</div>}
        {!roleOk && me && <div className="error" style={{ marginTop: 12 }}>Bu sayfaya erişim için admin rolü gerekli.</div>}
      </div>

      <div className="card" style={{ gridColumn: "span 7" }}>
        <h3>Onay Bekleyen Tarifler</h3>
        {pending.length === 0 ? (
          <div className="muted">Bekleyen tarif yok.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {pending.map((r) => (
              <div key={r.id} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 12, background: "var(--panel2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <strong>{r.title}</strong>
                  <span className="badge">#{r.id}</span>
                </div>
                <div className="muted" style={{ marginTop: 6 }}>
                  {r.description || "—"}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                  <button className="btn primary" onClick={() => approve(r.id)} disabled={!roleOk}>
                    Onayla
                  </button>
                  <button className="btn danger" onClick={() => reject(r.id)} disabled={!roleOk}>
                    Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ gridColumn: "span 5" }}>
        <h3>Kategoriler</h3>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <input className="input" value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Yeni kategori" />
          <button className="btn primary" onClick={createCategory} disabled={!roleOk}>
            Ekle
          </button>
        </div>
        <div style={{ marginTop: 10 }}>
          {categories.map((c) => (
            <span key={c.id} className="pill">
              {c.name}
            </span>
          ))}
        </div>

        <h3 style={{ marginTop: 16 }}>Malzeme Ekle</h3>
        <div className="field">
          <label className="muted">Ad</label>
          <input className="input" value={newIngName} onChange={(e) => setNewIngName(e.target.value)} placeholder="ör: biber" />
        </div>
        <div className="grid" style={{ marginTop: 8 }}>
          <div style={{ gridColumn: "span 7" }} className="field">
            <label className="muted">Kategori</label>
            <select className="input" value={newIngCat} onChange={(e) => setNewIngCat(e.target.value ? Number(e.target.value) : "")}>
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: "span 5" }} className="field">
            <label className="muted">Unit</label>
            <input className="input" value={newIngUnit} onChange={(e) => setNewIngUnit(e.target.value)} />
          </div>
        </div>
        <button className="btn primary" onClick={createIngredient} style={{ marginTop: 10 }} disabled={!roleOk}>
          Malzeme ekle
        </button>
      </div>

      <div className="card" style={{ gridColumn: "span 12" }}>
        <h3>Mevcut Malzemeler</h3>
        <div className="muted">Kategori ve unit bilgisiyle.</div>
        <div className="grid">
          {ingredients.map((i) => (
            <div key={i.id} style={{ gridColumn: "span 3", border: "1px solid var(--border)", borderRadius: 14, padding: 12, background: "var(--panel2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <strong>{i.name}</strong>
                <span className="badge">#{i.id}</span>
              </div>
              <div className="muted" style={{ marginTop: 6 }}>
                {i.category_id ? catNameById.get(i.category_id) : "—"} · {i.unit_type}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

