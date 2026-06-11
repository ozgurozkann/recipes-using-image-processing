import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { ConfirmModal } from "../components/Modal";
import { PageLoader } from "../components/Spinner";
import { toast, toastError } from "../components/Toast";
import { getRecipePhoto } from "../recipePhotos";

type Me = { id: number; full_name: string; email: string; role: string };
type User = { id: number; full_name: string; email: string; role: string; created_at: string };
type Category = { id: number; name: string };
type Ingredient = { id: number; name: string; category_id: number | null; unit_type: string };
type RecipeIngredient = { ingredient_id: number; name?: string; quantity: number; unit: string };
type Recipe = {
  id: number;
  title: string;
  description: string;
  instructions: string;
  cooking_time: number;
  serving_count: number;
  difficulty: string;
  category_id: number | null;
  image_url: string;
  created_by_user_id: number | null;
  is_approved: boolean;
  favorite_count: number;
  save_count: number;
  ingredients?: RecipeIngredient[];
};
type RecipeForm = {
  title: string;
  description: string;
  instructions: string;
  cooking_time: number;
  serving_count: number;
  difficulty: string;
  category_id: number | null;
  image_url: string;
};
type Tab = "recipes" | "pending" | "users" | "ingredients" | "categories";

const ADMIN_RECIPE_LIMIT = 100;
const emptyForm: RecipeForm = {
  title: "",
  description: "",
  instructions: "",
  cooking_time: 30,
  serving_count: 2,
  difficulty: "easy",
  category_id: null,
  image_url: "",
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeTotal, setRecipeTotal] = useState(0);
  const [recipeHasMore, setRecipeHasMore] = useState(false);
  const [loadingMoreRecipes, setLoadingMoreRecipes] = useState(false);
  const [pending, setPending] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [tab, setTab] = useState<Tab>("recipes");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [ingSearch, setIngSearch] = useState("");
  const [newCat, setNewCat] = useState("");
  const [newIngName, setNewIngName] = useState("");
  const [newIngCat, setNewIngCat] = useState<number | "">("");
  const [newIngUnit, setNewIngUnit] = useState("adet");
  const [form, setForm] = useState<RecipeForm>(emptyForm);
  const [selected, setSelected] = useState<Record<number, { quantity: number; unit: string }>>({});
  const [editingRecipeId, setEditingRecipeId] = useState<number | null>(null);
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [confirmReject, setConfirmReject] = useState<Recipe | null>(null);
  const [confirmDeleteRecipe, setConfirmDeleteRecipe] = useState<Recipe | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);

  async function refresh() {
    try {
      const [meOut, recipeOut, pendOut, userOut, catOut, ingOut] = await Promise.all([
        api<Me>("GET", "/auth/me"),
        api<{ items: Recipe[]; total: number; has_more: boolean }>("GET", `/admin/recipes?limit=${ADMIN_RECIPE_LIMIT}`),
        api<{ items: Recipe[] }>("GET", "/admin/pending-recipes"),
        api<{ items: User[] }>("GET", "/admin/users"),
        api<{ items: Category[] }>("GET", "/ingredients/categories"),
        api<{ items: Ingredient[] }>("GET", "/ingredients"),
      ]);
      setMe(meOut);
      setRecipes(recipeOut.items);
      setRecipeTotal(recipeOut.total);
      setRecipeHasMore(recipeOut.has_more);
      setPending(pendOut.items);
      setUsers(userOut.items);
      setCategories(catOut.items);
      setIngredients(ingOut.items);
    } catch (e: any) {
      toastError("Yükleme hatası", e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  const roleOk = me?.role === "admin";
  const catNameById = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const selectedCount = Object.keys(selected).length;
  const filteredRecipes = useMemo(
    () => recipes.filter((r) => !recipeSearch || r.title.toLocaleLowerCase("tr-TR").includes(recipeSearch.toLocaleLowerCase("tr-TR"))),
    [recipes, recipeSearch]
  );
  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLocaleLowerCase("tr-TR");
    return !q || u.full_name.toLocaleLowerCase("tr-TR").includes(q) || u.email.toLocaleLowerCase("tr-TR").includes(q);
  });
  const filteredIngs = useMemo(
    () => ingredients.filter((i) => !ingSearch || i.name.toLocaleLowerCase("tr-TR").includes(ingSearch.toLocaleLowerCase("tr-TR"))),
    [ingredients, ingSearch]
  );
  const formIngredientPreview = Object.entries(selected).slice(0, 8);

  function updateForm<K extends keyof RecipeForm>(key: K, value: RecipeForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetRecipeForm() {
    setForm(emptyForm);
    setSelected({});
    setEditingRecipeId(null);
  }

  function toggleIng(i: Ingredient) {
    setSelected((current) => {
      const next = { ...current };
      if (next[i.id]) delete next[i.id];
      else next[i.id] = { quantity: 1, unit: i.unit_type || "adet" };
      return next;
    });
  }

  async function loadRecipeForEdit(recipe: Recipe) {
    let source = recipe;
    try {
      source = await api<Recipe>("GET", `/recipes/${recipe.id}`);
    } catch {
      toast("Düzenleme modu", "Onaysız tarifte malzemeler ayrıca yüklenemedi.");
    }
    setForm({
      title: source.title || "",
      description: source.description || "",
      instructions: source.instructions || "",
      cooking_time: source.cooking_time || 0,
      serving_count: source.serving_count || 1,
      difficulty: source.difficulty || "easy",
      category_id: source.category_id ?? null,
      image_url: source.image_url || "",
    });
    const nextSelected: Record<number, { quantity: number; unit: string }> = {};
    source.ingredients?.forEach((item) => {
      nextSelected[item.ingredient_id] = { quantity: item.quantity, unit: item.unit };
    });
    setSelected(nextSelected);
    setEditingRecipeId(source.id);
    setTab("recipes");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveRecipe() {
    if (!form.title.trim()) {
      toastError("Tarif adı gerekli", "Lütfen tarif adını doldur.");
      return;
    }
    setSavingRecipe(true);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        ingredients: Object.entries(selected).map(([id, v]) => ({
          ingredient_id: Number(id),
          quantity: Number(v.quantity) || 1,
          unit: v.unit || "adet",
        })),
      };
      if (editingRecipeId) {
        await api("PUT", `/recipes/${editingRecipeId}`, payload);
        toast("Tarif güncellendi", form.title);
      } else {
        await api("POST", "/recipes", payload);
        toast("Tarif eklendi", "Admin olduğun için direkt onaylı yayınlandı.");
      }
      resetRecipeForm();
      refresh();
    } catch (e: any) {
      toastError("Kaydedilemedi", e.message);
    } finally {
      setSavingRecipe(false);
    }
  }

  async function loadMoreRecipes() {
    setLoadingMoreRecipes(true);
    try {
      const out = await api<{ items: Recipe[]; total: number; has_more: boolean }>("GET", `/admin/recipes?skip=${recipes.length}&limit=${ADMIN_RECIPE_LIMIT}`);
      setRecipes((current) => [...current, ...out.items]);
      setRecipeTotal(out.total);
      setRecipeHasMore(out.has_more);
    } catch (e: any) {
      toastError("Tarifler yüklenemedi", e.message);
    } finally {
      setLoadingMoreRecipes(false);
    }
  }

  async function approve(r: Recipe) {
    try { await api("PUT", `/admin/recipes/${r.id}/approve`); toast("Tarif onaylandı", r.title); refresh(); }
    catch (e: any) { toastError("Hata", e.message); }
  }

  async function reject(r: Recipe) {
    try { await api("PUT", `/admin/recipes/${r.id}/reject`); toast("Tarif beklemeye alındı", r.title); setConfirmReject(null); refresh(); }
    catch (e: any) { toastError("Hata", e.message); }
  }

  async function deleteRecipe(r: Recipe) {
    try { await api("DELETE", `/recipes/${r.id}`); toast("Tarif silindi", r.title); setConfirmDeleteRecipe(null); refresh(); }
    catch (e: any) { toastError("Hata", e.message); }
  }

  async function updateUserRole(user: User, role: string) {
    try { await api("PUT", `/admin/users/${user.id}`, { role }); toast("Kullanıcı güncellendi", user.email); refresh(); }
    catch (e: any) { toastError("Hata", e.message); }
  }

  async function deleteUser(user: User) {
    try { await api("DELETE", `/admin/users/${user.id}`); toast("Kullanıcı silindi", user.email); setConfirmDeleteUser(null); refresh(); }
    catch (e: any) { toastError("Hata", e.message); }
  }

  async function createCategory() {
    if (!newCat.trim()) return;
    try { await api("POST", "/ingredients/categories", { name: newCat.trim() }); setNewCat(""); toast("Kategori eklendi"); refresh(); }
    catch (e: any) { toastError("Hata", e.message); }
  }

  async function deleteCategory(id: number) {
    try { await api("DELETE", `/ingredients/categories/${id}`); toast("Kategori silindi"); refresh(); }
    catch (e: any) { toastError("Hata", e.message); }
  }

  async function createIngredient() {
    if (!newIngName.trim()) return;
    try {
      await api("POST", "/ingredients", { name: newIngName.trim().toLowerCase(), category_id: newIngCat === "" ? null : newIngCat, unit_type: newIngUnit });
      setNewIngName("");
      toast("Malzeme eklendi");
      refresh();
    } catch (e: any) { toastError("Hata", e.message); }
  }

  async function deleteIngredient(id: number) {
    try { await api("DELETE", `/ingredients/${id}`); toast("Malzeme silindi"); refresh(); }
    catch (e: any) { toastError("Hata", e.message); }
  }

  if (loading) return <PageLoader />;

  const statCards = [
    { label: "Total Recipes", val: recipeTotal || recipes.length, meta: "Database synchronized", icon: "restaurant_menu", tone: "green" },
    { label: "Pending Approvals", val: pending.length, meta: pending.length ? "Needs review" : "All caught up", icon: "pending_actions", tone: "orange" },
    { label: "Users", val: users.length, meta: `${users.filter((u) => u.role === "admin").length} system admins`, icon: "group", tone: "green" },
    { label: "Ingredients", val: ingredients.length, meta: `${categories.length} categories`, icon: "nutrition", tone: "dark" },
  ];

  return (
    <main className="admin-page">
      <div className="admin-tabs">
        {[
          ["recipes", "Tarifler"],
          ["pending", `Onay (${pending.length})`],
          ["users", "Kullanıcılar"],
          ["ingredients", "Malzemeler"],
          ["categories", "Kategoriler"],
        ].map(([key, label]) => (
          <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key as Tab)}>{label}</button>
        ))}
      </div>

      {!roleOk && <div className="admin-alert">Bu sayfaya erişim için admin rolü gerekli.</div>}

      <div className="admin-stats">
        {statCards.map((s) => (
          <div key={s.label} className="admin-stat-card">
            <div className="admin-stat-head"><span>{s.label}</span><span className={`material-symbols-outlined ${s.tone}`}>{s.icon}</span></div>
            <strong>{s.val}</strong><small>{s.meta}</small>
          </div>
        ))}
      </div>

      {tab === "recipes" && (
        <div className="admin-workspace">
          <section className="admin-form-side">
            <div className="admin-section-title"><span className="material-symbols-outlined">add_circle</span><h2>{editingRecipeId ? "Tarifi Düzenle" : "Add New Recipe"}</h2></div>
            <div className="admin-panel admin-form-panel">
              <div className="admin-form-grid">
                <div className="admin-field"><label>Tarif adı</label><input placeholder="Recipe Name" value={form.title} onChange={(e) => updateForm("title", e.target.value)} /></div>
                <div className="admin-field"><label>Açıklama</label><textarea placeholder="Recipe Description" rows={3} value={form.description} onChange={(e) => updateForm("description", e.target.value)} /></div>
                <div className="admin-two-cols">
                  <div className="admin-field"><label>Süre (dk)</label><input type="number" min={0} value={form.cooking_time} onChange={(e) => updateForm("cooking_time", Number(e.target.value))} /></div>
                  <div className="admin-field"><label>Porsiyon</label><input type="number" min={1} value={form.serving_count} onChange={(e) => updateForm("serving_count", Number(e.target.value))} /></div>
                </div>
                <div className="admin-two-cols">
                  <div className="admin-field"><label>Zorluk</label><select value={form.difficulty} onChange={(e) => updateForm("difficulty", e.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
                  <div className="admin-field"><label>Kategori</label><select value={form.category_id ?? ""} onChange={(e) => updateForm("category_id", e.target.value ? Number(e.target.value) : null)}><option value="">Seç</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                </div>
                <div className="admin-field"><label>Görsel URL</label><input placeholder="https://..." value={form.image_url} onChange={(e) => updateForm("image_url", e.target.value)} /></div>
                <div className="admin-field"><label>Talimatlar</label><textarea placeholder="Hazırlanış adımları" rows={4} value={form.instructions} onChange={(e) => updateForm("instructions", e.target.value)} /></div>
                <div className="admin-ingredient-picker">
                  <div className="admin-picker-head">
                    <strong>Malzemeler</strong>
                    <span>{selectedCount} seçili</span>
                  </div>
                  <div className="admin-search admin-form-search"><span className="material-symbols-outlined">search</span><input placeholder="Malzeme ara..." value={ingSearch} onChange={(e) => setIngSearch(e.target.value)} /></div>
                  <div className="admin-ingredient-list">
                    {filteredIngs.slice(0, 120).map((i) => {
                      const picked = selected[i.id];
                      return (
                        <div key={i.id} className={`admin-ing-card${picked ? " selected" : ""}`} onClick={() => toggleIng(i)}>
                          <div className="admin-ing-main"><input type="checkbox" checked={!!picked} readOnly /><span>{i.name}</span></div>
                          {picked && (
                            <div className="admin-ing-controls" onClick={(e) => e.stopPropagation()}>
                              <input type="number" min={0} value={picked.quantity} onChange={(e) => setSelected((s) => ({ ...s, [i.id]: { ...s[i.id], quantity: Number(e.target.value) } }))} />
                              <input value={picked.unit} onChange={(e) => setSelected((s) => ({ ...s, [i.id]: { ...s[i.id], unit: e.target.value } }))} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {!!formIngredientPreview.length && (
                    <div className="admin-selected-preview">
                      {formIngredientPreview.map(([id, value]) => <span key={id}>{ingredients.find((i) => i.id === Number(id))?.name || id} · {value.quantity} {value.unit}</span>)}
                    </div>
                  )}
                </div>
                <div className="admin-form-actions">
                  {editingRecipeId && <button className="admin-secondary-btn" type="button" onClick={resetRecipeForm}>Vazgeç</button>}
                  <button className="admin-primary-btn" disabled={!roleOk || savingRecipe} onClick={saveRecipe}>{savingRecipe ? "Kaydediliyor..." : editingRecipeId ? "Güncelle" : "Add Recipe"}</button>
                </div>
              </div>
            </div>
          </section>

          <section className="admin-recipes-side">
            <div className="admin-list-head"><h2>All Recipes</h2><div className="admin-search"><span className="material-symbols-outlined">search</span><input placeholder="Search recipes..." value={recipeSearch} onChange={(e) => setRecipeSearch(e.target.value)} /></div></div>
            <div className="admin-recipe-list">
              {filteredRecipes.map((r) => <RecipeRow key={r.id} recipe={r} author={r.created_by_user_id ? userById.get(r.created_by_user_id)?.email : "Seed"} onEdit={() => loadRecipeForEdit(r)} onApprove={() => approve(r)} onReject={() => setConfirmReject(r)} onDelete={() => setConfirmDeleteRecipe(r)} roleOk={roleOk} />)}
            </div>
            {recipeHasMore && <div className="admin-load-more"><button onClick={loadMoreRecipes} disabled={loadingMoreRecipes}>{loadingMoreRecipes ? "Yükleniyor..." : `Load more recipes (${recipes.length}/${recipeTotal})`}<span className="material-symbols-outlined">expand_more</span></button></div>}
          </section>
        </div>
      )}

      {tab === "pending" && (
        <section className="admin-panel">
          <div className="admin-list-head"><h2>Onay Bekleyen Tarifler</h2></div>
          <div className="admin-recipe-list">
            {pending.length === 0 ? <div className="admin-empty"><strong>Onay bekleyen tarif yok</strong><span>Tüm tarifler işlenmiş.</span></div> : pending.map((r) => <RecipeRow key={r.id} recipe={r} author={r.created_by_user_id ? userById.get(r.created_by_user_id)?.email : "Seed"} onEdit={() => loadRecipeForEdit(r)} onApprove={() => approve(r)} onReject={() => setConfirmReject(r)} onDelete={() => setConfirmDeleteRecipe(r)} roleOk={roleOk} />)}
          </div>
        </section>
      )}

      {tab === "users" && (
        <section className="admin-panel">
          <div className="admin-list-head"><h2>Kullanıcılar</h2><div className="admin-search"><span className="material-symbols-outlined">search</span><input placeholder="Kullanıcı ara..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} /></div></div>
          <div className="admin-user-list">{filteredUsers.map((u) => <div key={u.id} className="admin-user-row"><div className="admin-user-id"><strong>{u.full_name || "İsimsiz kullanıcı"}</strong><span>{u.email}</span></div><select value={u.role} disabled={!roleOk || u.id === me?.id} onChange={(e) => updateUserRole(u, e.target.value)}><option value="user">user</option><option value="admin">admin</option></select><button className="admin-danger-btn" disabled={!roleOk || u.id === me?.id} onClick={() => setConfirmDeleteUser(u)}>Sil</button></div>)}</div>
        </section>
      )}

      {tab === "ingredients" && (
        <div className="admin-stack">
          <section className="admin-panel"><div className="admin-list-head"><h2>Yeni Malzeme</h2></div><div className="admin-form-grid ingredient-create"><div className="admin-field"><label>Ad</label><input value={newIngName} onChange={(e) => setNewIngName(e.target.value)} /></div><div className="admin-field"><label>Kategori</label><select value={newIngCat} onChange={(e) => setNewIngCat(e.target.value ? Number(e.target.value) : "")}><option value="">Seç</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div className="admin-field"><label>Birim</label><input value={newIngUnit} onChange={(e) => setNewIngUnit(e.target.value)} /></div><button className="admin-primary-btn compact" disabled={!roleOk || !newIngName.trim()} onClick={createIngredient}>Ekle</button></div></section>
          <section className="admin-panel"><div className="admin-list-head"><h2>Malzemeler</h2><div className="admin-search"><span className="material-symbols-outlined">search</span><input placeholder="Ara..." value={ingSearch} onChange={(e) => setIngSearch(e.target.value)} /></div></div><div className="admin-chip-grid">{filteredIngs.map((i) => <div key={i.id} className="admin-data-chip"><div><strong>{i.name}</strong><span>{i.category_id ? catNameById.get(i.category_id) : "-"} / {i.unit_type}</span></div><button disabled={!roleOk} onClick={() => deleteIngredient(i.id)}>Sil</button></div>)}</div></section>
        </div>
      )}

      {tab === "categories" && (
        <div className="admin-stack">
          <section className="admin-panel"><div className="admin-list-head"><h2>Yeni Kategori</h2></div><div className="admin-inline-create"><input value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createCategory()} /><button disabled={!roleOk || !newCat.trim()} onClick={createCategory}>Ekle</button></div></section>
          <section className="admin-chip-grid">{categories.map((c) => <div key={c.id} className="admin-data-chip category"><div><strong>{c.name}</strong><span>{ingredients.filter((i) => i.category_id === c.id).length} malzeme</span></div><button disabled={!roleOk} onClick={() => deleteCategory(c.id)}>Sil</button></div>)}</section>
        </div>
      )}

      <ConfirmModal isOpen={!!confirmReject} onClose={() => setConfirmReject(null)} onConfirm={() => confirmReject && reject(confirmReject)} title="Tarifi beklemeye al" message={`"${confirmReject?.title}" tarifini onaysız duruma almak istiyor musun?`} confirmLabel="Onaysız yap" confirmClass="btn danger" />
      <ConfirmModal isOpen={!!confirmDeleteRecipe} onClose={() => setConfirmDeleteRecipe(null)} onConfirm={() => confirmDeleteRecipe && deleteRecipe(confirmDeleteRecipe)} title="Tarifi sil" message={`"${confirmDeleteRecipe?.title}" tarifini kalıcı olarak silmek istiyor musun?`} confirmLabel="Sil" confirmClass="btn danger" />
      <ConfirmModal isOpen={!!confirmDeleteUser} onClose={() => setConfirmDeleteUser(null)} onConfirm={() => confirmDeleteUser && deleteUser(confirmDeleteUser)} title="Kullanıcıyı sil" message={`${confirmDeleteUser?.email} kullanıcısını silmek istiyor musun?`} confirmLabel="Sil" confirmClass="btn danger" />
    </main>
  );
}

function RecipeRow({ recipe, author, onEdit, onApprove, onReject, onDelete, roleOk }: { recipe: Recipe; author?: string; onEdit: () => void; onApprove: () => void; onReject: () => void; onDelete: () => void; roleOk: boolean }) {
  const photo = getRecipePhoto(recipe, 220, 220);
  return (
    <article className="admin-recipe-row">
      <div className="admin-recipe-thumb"><img src={photo} alt={recipe.title} loading="lazy" /></div>
      <div className="admin-recipe-body">
        <div className="admin-recipe-title"><h3>{recipe.title} <span>#{recipe.id}</span></h3><span className={`admin-status ${recipe.is_approved ? "approved" : "pending"}`}>{recipe.is_approved ? "Approved" : "Pending"}</span></div>
        <div className="admin-recipe-meta"><span><span className="material-symbols-outlined">database</span>{author || "Seed"}</span><span><span className="material-symbols-outlined">schedule</span>{recipe.cooking_time || 0} dk</span><span><span className="material-symbols-outlined">favorite</span>{recipe.favorite_count}</span><span><span className="material-symbols-outlined">bookmark</span>{recipe.save_count}</span></div>
        <div className="admin-recipe-actions">
          <Link className="admin-action-btn" to={`/recipes/${recipe.id}`} title="Gör"><span className="material-symbols-outlined">visibility</span></Link>
          <button className="admin-action-btn" disabled={!roleOk} title="Düzenle" onClick={onEdit}><span className="material-symbols-outlined">edit</span></button>
          {recipe.is_approved ? <button className="admin-action-btn warning" disabled={!roleOk} title="Onayı kaldır" onClick={onReject}><span className="material-symbols-outlined">undo</span></button> : <button className="admin-action-btn ok" disabled={!roleOk} title="Onayla" onClick={onApprove}><span className="material-symbols-outlined">check_circle</span></button>}
          <span className="admin-action-spacer" />
          <button className="admin-action-btn danger" disabled={!roleOk} title="Sil" onClick={onDelete}><span className="material-symbols-outlined">delete</span></button>
        </div>
      </div>
    </article>
  );
}
