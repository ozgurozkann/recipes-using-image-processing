import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { PageLoader } from "../components/Spinner";
import { toast, toastError } from "../components/Toast";
import { ConfirmModal } from "../components/Modal";

type Me = { id: number; full_name: string; email: string; role: string };
type Recipe = { id: number; title: string; description: string; is_approved: boolean; created_by_user_id: number | null };
type Category = { id: number; name: string };
type Ingredient = { id: number; name: string; category_id: number | null; unit_type: string };

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [pending, setPending] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [tab, setTab] = useState<"pending" | "ingredients" | "categories">("pending");

  const [newCat, setNewCat] = useState("");
  const [newIngName, setNewIngName] = useState("");
  const [newIngCat, setNewIngCat] = useState<number | "">("");
  const [newIngUnit, setNewIngUnit] = useState("adet");
  const [confirmReject, setConfirmReject] = useState<Recipe | null>(null);
  const [ingSearch, setIngSearch] = useState("");

  async function refresh() {
    try {
      const [meOut, pendOut, catOut, ingOut] = await Promise.all([
        api<Me>("GET", "/auth/me"),
        api<{ items: Recipe[] }>("GET", "/admin/pending-recipes"),
        api<{ items: Category[] }>("GET", "/ingredients/categories"),
        api<{ items: Ingredient[] }>("GET", "/ingredients"),
      ]);
      setMe(meOut);
      setPending(pendOut.items);
      setCategories(catOut.items);
      setIngredients(ingOut.items);
    } catch (e: any) { toastError("Yükleme Hatası", e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, []);

  const roleOk = me?.role === "admin";

  async function approve(r: Recipe) {
    await api("PUT", `/admin/recipes/${r.id}/approve`);
    toast("Onaylandı ✓", r.title);
    refresh();
  }
  async function reject(r: Recipe) {
    await api("PUT", `/admin/recipes/${r.id}/reject`);
    toast("Reddedildi", r.title);
    refresh();
  }

  async function createCategory() {
    if (!newCat.trim()) return;
    try {
      await api("POST", "/ingredients/categories", { name: newCat.trim() });
      setNewCat("");
      toast("Kategori eklendi");
      refresh();
    } catch (e: any) { toastError("Hata", e.message); }
  }

  async function deleteCategory(id: number) {
    try {
      await api("DELETE", `/ingredients/categories/${id}`);
      toast("Kategori silindi");
      refresh();
    } catch (e: any) { toastError("Hata", e.message); }
  }

  async function createIngredient() {
    if (!newIngName.trim()) return;
    try {
      await api("POST", "/ingredients", {
        name: newIngName.trim().toLowerCase(),
        category_id: newIngCat === "" ? null : newIngCat,
        unit_type: newIngUnit,
      });
      setNewIngName("");
      toast("Malzeme eklendi");
      refresh();
    } catch (e: any) { toastError("Hata", e.message); }
  }

  async function deleteIngredient(id: number) {
    try {
      await api("DELETE", `/ingredients/${id}`);
      toast("Malzeme silindi");
      refresh();
    } catch (e: any) { toastError("Hata", e.message); }
  }

  const catNameById = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const filteredIngs = useMemo(() =>
    ingredients.filter((i) => !ingSearch || i.name.toLowerCase().includes(ingSearch.toLowerCase())),
    [ingredients, ingSearch]
  );

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="page-hero">
        <h1 className="page-title">⚙️ <span>Admin Paneli</span></h1>
        <p className="page-sub">Tarif yönetimi, malzeme ve kategori işlemleri.</p>
      </div>

      {!roleOk && (
        <div className="error" style={{ marginBottom: 20 }}>
          ⚠ Bu sayfaya erişim için admin rolü gerekli.
        </div>
      )}

      {/* Stats */}
      <div className="grid stagger" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 4 }}>
        {[
          { label: "Onay Bekleyen", val: pending.length, color: "var(--warning)", icon: "⏳" },
          { label: "Toplam Malzeme", val: ingredients.length, color: "var(--ok)", icon: "🥦" },
          { label: "Kategori", val: categories.length, color: "var(--primary-light)", icon: "📂" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ textAlign: "center", padding: 20 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-1px",
              background: `linear-gradient(135deg, ${s.color}, var(--primary))`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {s.val}
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
        {(["pending", "ingredients", "categories"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="btn ghost"
            style={{
              borderRadius: "var(--radius-sm) var(--radius-sm) 0 0", borderBottom: "2px solid",
              borderBottomColor: tab === t ? "var(--primary)" : "transparent",
              color: tab === t ? "var(--primary-light)" : "var(--muted)", fontWeight: tab === t ? 700 : 400,
            }}>
            {t === "pending" ? `⏳ Onay Bekleyenler (${pending.length})` : t === "ingredients" ? "🥦 Malzemeler" : "📂 Kategoriler"}
          </button>
        ))}
      </div>

      {/* ── Pending ── */}
      {tab === "pending" && (
        <div style={{ animation: "fadeUp 0.3s ease both" }}>
          {pending.length === 0 ? (
            <div className="empty card">
              <div className="empty-icon">✅</div>
              <div className="empty-title">Onay bekleyen tarif yok</div>
              <div className="empty-sub">Harika! Tüm tarifler işlendi.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }} className="stagger">
              {pending.map((r) => (
                <div key={r.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <strong style={{ fontSize: 16 }}>{r.title}</strong>
                      <span className="badge">#{r.id}</span>
                      <span className="badge warning">Onay Bekliyor</span>
                    </div>
                    <div style={{ fontSize: 14, color: "var(--muted)" }}>{r.description || "—"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button className="btn ok" disabled={!roleOk} onClick={() => approve(r)}>✓ Onayla</button>
                    <button className="btn danger" disabled={!roleOk} onClick={() => setConfirmReject(r)}>✕ Reddet</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Ingredients ── */}
      {tab === "ingredients" && (
        <div style={{ animation: "fadeUp 0.3s ease both" }}>
          {/* Add form */}
          <div className="card" style={{ marginBottom: 16, padding: "20px 20px 20px" }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Yeni Malzeme Ekle</h3>
            <div className="grid" style={{ gridTemplateColumns: "1fr 200px 120px auto", gap: 10, margin: 0, alignItems: "end" }}>
              <div className="field" style={{ marginTop: 0 }}>
                <label className="label">Ad</label>
                <input className="input" value={newIngName} onChange={(e) => setNewIngName(e.target.value)} placeholder="ör: biber" />
              </div>
              <div className="field" style={{ marginTop: 0 }}>
                <label className="label">Kategori</label>
                <select className="input" value={newIngCat} onChange={(e) => setNewIngCat(e.target.value ? Number(e.target.value) : "")}>
                  <option value="">— Seç —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="field" style={{ marginTop: 0 }}>
                <label className="label">Birim</label>
                <input className="input" value={newIngUnit} onChange={(e) => setNewIngUnit(e.target.value)} />
              </div>
              <button className="btn primary" disabled={!roleOk || !newIngName.trim()} onClick={createIngredient}>Ekle</button>
            </div>
          </div>

          {/* Search + List */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 10 }}>
              <h3 style={{ fontWeight: 700, margin: 0 }}>Mevcut Malzemeler ({ingredients.length})</h3>
              <div style={{ position: "relative", width: 220 }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>🔍</span>
                <input className="input" placeholder="Ara…" value={ingSearch}
                  onChange={(e) => setIngSearch(e.target.value)} style={{ paddingLeft: 32 }} />
              </div>
            </div>
            <div className="grid stagger" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", margin: 0 }}>
              {filteredIngs.map((i) => (
                <div key={i.id} className="card card-sm" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{i.name}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      {i.category_id ? catNameById.get(i.category_id) : "—"} · {i.unit_type}
                    </div>
                  </div>
                  <button className="btn-icon btn ghost" style={{ fontSize: 12, width: 26, height: 26 }}
                    disabled={!roleOk} onClick={() => deleteIngredient(i.id)} title="Sil">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Categories ── */}
      {tab === "categories" && (
        <div style={{ animation: "fadeUp 0.3s ease both" }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 14 }}>Yeni Kategori Ekle</h3>
            <div style={{ display: "flex", gap: 10 }}>
              <input className="input" value={newCat} onChange={(e) => setNewCat(e.target.value)}
                placeholder="Kategori adı…" onKeyDown={(e) => e.key === "Enter" && createCategory()} />
              <button className="btn primary" disabled={!roleOk || !newCat.trim()} onClick={createCategory}>Ekle</button>
            </div>
          </div>

          <div className="grid stagger" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
            {categories.map((c) => (
              <div key={c.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    #{c.id} · {ingredients.filter((i) => i.category_id === c.id).length} malzeme
                  </div>
                </div>
                <button className="btn-icon btn ghost" style={{ fontSize: 14 }}
                  disabled={!roleOk} onClick={() => deleteCategory(c.id)} title="Sil">×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm reject */}
      <ConfirmModal
        isOpen={!!confirmReject}
        onClose={() => setConfirmReject(null)}
        onConfirm={() => confirmReject && reject(confirmReject)}
        title="Tarifi Reddet"
        message={`"${confirmReject?.title}" tarifini reddetmek istediğinden emin misin?`}
        confirmLabel="Reddet" confirmClass="btn danger"
      />
    </div>
  );
}
