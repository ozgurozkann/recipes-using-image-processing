import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { ConfirmModal } from "../components/Modal";
import { toast, toastError } from "../components/Toast";
import { getRecipePhoto } from "../recipePhotos";

type Me = { id: number; full_name: string; email: string; role: string };
type User = { id: number; full_name: string; email: string; role: string; created_at: string };
type Category = { id: number; name: string };
type Ingredient = { id: number; name: string; category_id: number | null; unit_type: string };
type RecipeIngredient = { ingredient_id: number; name?: string; quantity: number; unit: string };
type Recipe = {
  id: number; title: string; description: string; instructions: string;
  cooking_time: number; serving_count: number; difficulty: string;
  category_id: number | null; image_url: string; created_by_user_id: number | null;
  is_approved: boolean; favorite_count: number; save_count: number;
  ingredients?: RecipeIngredient[];
};
type RecipeForm = {
  title: string; description: string; instructions: string;
  cooking_time: number; serving_count: number; difficulty: string;
  category_id: number | null; image_url: string;
};
type Tab = "recipes" | "pending" | "users" | "ingredients" | "categories";

const ADMIN_RECIPE_LIMIT = 100;
const emptyForm: RecipeForm = {
  title: "", description: "", instructions: "",
  cooking_time: 30, serving_count: 2, difficulty: "easy",
  category_id: null, image_url: "",
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
    setForm((c) => ({ ...c, [key]: value }));
  }

  function resetRecipeForm() {
    setForm(emptyForm); setSelected({}); setEditingRecipeId(null);
  }

  function toggleIng(i: Ingredient) {
    setSelected((c) => {
      const n = { ...c };
      if (n[i.id]) delete n[i.id]; else n[i.id] = { quantity: 1, unit: i.unit_type || "adet" };
      return n;
    });
  }

  async function loadRecipeForEdit(recipe: Recipe) {
    let source = recipe;
    try { source = await api<Recipe>("GET", `/recipes/${recipe.id}`); }
    catch { toast("Düzenleme modu", "Onaysız tarifte malzemeler ayrıca yüklenemedi."); }
    setForm({
      title: source.title || "", description: source.description || "",
      instructions: source.instructions || "", cooking_time: source.cooking_time || 0,
      serving_count: source.serving_count || 1, difficulty: source.difficulty || "easy",
      category_id: source.category_id ?? null, image_url: source.image_url || "",
    });
    const sel: Record<number, { quantity: number; unit: string }> = {};
    source.ingredients?.forEach((item) => { sel[item.ingredient_id] = { quantity: item.quantity, unit: item.unit }; });
    setSelected(sel);
    setEditingRecipeId(source.id);
    setTab("recipes");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveRecipe() {
    if (!form.title.trim()) { toastError("Tarif adı gerekli", "Lütfen tarif adını doldur."); return; }
    setSavingRecipe(true);
    try {
      const payload = {
        ...form, title: form.title.trim(),
        ingredients: Object.entries(selected).map(([id, v]) => ({
          ingredient_id: Number(id), quantity: Number(v.quantity) || 1, unit: v.unit || "adet",
        })),
      };
      if (editingRecipeId) {
        await api("PUT", `/recipes/${editingRecipeId}`, payload);
        toast("Tarif güncellendi", form.title);
      } else {
        await api("POST", "/recipes", payload);
        toast("Tarif eklendi", "Admin olduğun için direkt onaylı yayınlandı.");
      }
      resetRecipeForm(); refresh();
    } catch (e: any) { toastError("Kaydedilemedi", e.message); }
    finally { setSavingRecipe(false); }
  }

  async function loadMoreRecipes() {
    setLoadingMoreRecipes(true);
    try {
      const out = await api<{ items: Recipe[]; total: number; has_more: boolean }>("GET", `/admin/recipes?skip=${recipes.length}&limit=${ADMIN_RECIPE_LIMIT}`);
      setRecipes((c) => [...c, ...out.items]);
      setRecipeTotal(out.total); setRecipeHasMore(out.has_more);
    } catch (e: any) { toastError("Tarifler yüklenemedi", e.message); }
    finally { setLoadingMoreRecipes(false); }
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
      setNewIngName(""); toast("Malzeme eklendi"); refresh();
    } catch (e: any) { toastError("Hata", e.message); }
  }

  async function deleteIngredient(id: number) {
    try { await api("DELETE", `/ingredients/${id}`); toast("Malzeme silindi"); refresh(); }
    catch (e: any) { toastError("Hata", e.message); }
  }

  if (loading) return (
    <div className="page-loader">
      <span className="spinner spinner-primary" style={{ width: 36, height: 36 }} />
    </div>
  );

  const statCards = [
    { label: "Toplam Tarif", val: recipeTotal || recipes.length, meta: "Veritabanı senkron", icon: "restaurant_menu", iconColor: "text-primary" },
    { label: "Onay Bekleyen", val: pending.length, meta: pending.length ? "İnceleme bekliyor" : "Hepsi işlendi", icon: "pending_actions", iconColor: "text-secondary" },
    { label: "Kullanıcılar", val: users.length, meta: `${users.filter((u) => u.role === "admin").length} sistem admin`, icon: "group", iconColor: "text-primary" },
    { label: "Malzemeler", val: ingredients.length, meta: `${categories.length} kategori`, icon: "nutrition", iconColor: "text-on-surface" },
  ];

  const inputClass = "w-full px-3 py-2 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="pb-16">
      <main className="mt-0 flex-grow w-full max-w-7xl mx-auto px-5 md:px-16 py-6 space-y-6">

        {!roleOk && (
          <div className="px-4 py-3 bg-error-container text-on-error-container rounded-xl text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined">warning</span>
            Bu sayfaya erişim için admin rolü gerekli.
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-outline-variant gap-6 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {([
            ["recipes", "Tarifler"],
            ["pending", `Onay (${pending.length})`],
            ["users", "Kullanıcılar"],
            ["ingredients", "Malzemeler"],
            ["categories", "Kategoriler"],
          ] as [Tab, string][]).map(([key, label]) => (
            <button
              key={key}
              className={`px-1 py-3 text-sm font-medium whitespace-nowrap transition-all ${tab === key ? "border-b-2 border-primary text-primary font-semibold" : "text-on-surface-variant hover:text-primary"}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-5 flex flex-col gap-2 hover:scale-[1.02] transition-transform ambient-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{s.label}</span>
                <span className={`material-symbols-outlined ${s.iconColor}`}>{s.icon}</span>
              </div>
              <div className="text-2xl font-bold text-on-surface">{s.val}</div>
              <div className="text-xs text-on-surface-variant">{s.meta}</div>
            </div>
          ))}
        </div>

        {/* Recipes Tab */}
        {tab === "recipes" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form */}
            <section className="lg:col-span-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary">add_circle</span>
                <h2 className="font-bold text-on-surface">{editingRecipeId ? "Tarifi Düzenle" : "Yeni Tarif Ekle"}</h2>
              </div>
              <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 space-y-4 ambient-shadow">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Tarif Adı</label>
                  <input className={inputClass} placeholder="Tarif Adı" value={form.title} onChange={(e) => updateForm("title", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Açıklama</label>
                  <textarea className={inputClass} placeholder="Açıklama" rows={3} value={form.description} onChange={(e) => updateForm("description", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Süre (dk)</label>
                    <input className={inputClass} type="number" min={0} value={form.cooking_time} onChange={(e) => updateForm("cooking_time", Number(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Porsiyon</label>
                    <input className={inputClass} type="number" min={1} value={form.serving_count} onChange={(e) => updateForm("serving_count", Number(e.target.value))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Zorluk</label>
                    <select className={inputClass} value={form.difficulty} onChange={(e) => updateForm("difficulty", e.target.value)}>
                      <option value="easy">Kolay</option><option value="medium">Orta</option><option value="hard">Zor</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Kategori</label>
                    <select className={inputClass} value={form.category_id ?? ""} onChange={(e) => updateForm("category_id", e.target.value ? Number(e.target.value) : null)}>
                      <option value="">Seç</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Görsel URL</label>
                  <input className={inputClass} placeholder="https://..." value={form.image_url} onChange={(e) => updateForm("image_url", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Talimatlar</label>
                  <textarea className={inputClass} placeholder="Hazırlanış adımları" rows={4} value={form.instructions} onChange={(e) => updateForm("instructions", e.target.value)} />
                </div>

                {/* Ingredient Picker */}
                <div className="border border-outline-variant/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Malzemeler</span>
                    <span className="text-xs font-semibold text-primary">{selectedCount} seçili</span>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
                    <input className={`${inputClass} pl-9`} placeholder="Malzeme ara..." value={ingSearch} onChange={(e) => setIngSearch(e.target.value)} />
                  </div>
                  <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                    {filteredIngs.slice(0, 120).map((i) => {
                      const picked = selected[i.id];
                      return (
                        <div
                          key={i.id}
                          className={`p-2 rounded-lg cursor-pointer transition-colors ${picked ? "bg-primary-fixed/40 border border-primary/20" : "hover:bg-surface-container-low"}`}
                          onClick={() => toggleIng(i)}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${picked ? "bg-primary border-primary" : "border-outline-variant"}`}>
                              {picked && <span className="material-symbols-outlined text-white" style={{ fontSize: 10 }}>check</span>}
                            </div>
                            <span className="text-xs font-medium">{i.name}</span>
                          </div>
                          {picked && (
                            <div className="grid grid-cols-2 gap-1 mt-2 pl-6" onClick={(e) => e.stopPropagation()}>
                              <input type="number" min={0} value={picked.quantity}
                                onChange={(e) => setSelected((s) => ({ ...s, [i.id]: { ...s[i.id], quantity: Number(e.target.value) } }))}
                                className="border border-outline-variant/50 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary" />
                              <input value={picked.unit}
                                onChange={(e) => setSelected((s) => ({ ...s, [i.id]: { ...s[i.id], unit: e.target.value } }))}
                                className="border border-outline-variant/50 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {formIngredientPreview.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2 border-t border-outline-variant/30">
                      {formIngredientPreview.map(([id, v]) => (
                        <span key={id} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-full">
                          {ingredients.find((i) => i.id === Number(id))?.name || id} · {v.quantity} {v.unit}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  {editingRecipeId && (
                    <button type="button" onClick={resetRecipeForm}
                      className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface-variant text-sm font-semibold hover:bg-surface-container-low transition-colors">
                      Vazgeç
                    </button>
                  )}
                  <button
                    className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={!roleOk || savingRecipe}
                    onClick={saveRecipe}
                  >
                    {savingRecipe ? <><span className="spinner" />Kaydediliyor…</> : editingRecipeId ? "Güncelle" : "Tarif Ekle"}
                  </button>
                </div>
              </div>
            </section>

            {/* Recipe List */}
            <section className="lg:col-span-7">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-on-surface">Tüm Tarifler</h2>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
                  <input className="pl-9 pr-4 py-2 bg-white border border-outline-variant/30 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary w-48" placeholder="Tarif ara..." value={recipeSearch} onChange={(e) => setRecipeSearch(e.target.value)} />
                </div>
              </div>
              <div className="space-y-3 max-h-[75vh] overflow-y-auto custom-scrollbar pr-1">
                {filteredRecipes.map((r) => (
                  <RecipeRow key={r.id} recipe={r} author={r.created_by_user_id ? userById.get(r.created_by_user_id)?.email : "Seed"}
                    onEdit={() => loadRecipeForEdit(r)} onApprove={() => approve(r)}
                    onReject={() => setConfirmReject(r)} onDelete={() => setConfirmDeleteRecipe(r)} roleOk={roleOk} />
                ))}
                {recipeHasMore && (
                  <button className="w-full py-3 text-primary text-sm font-semibold hover:underline flex items-center justify-center gap-2"
                    onClick={loadMoreRecipes} disabled={loadingMoreRecipes}>
                    {loadingMoreRecipes ? "Yükleniyor…" : `Daha fazla yükle (${recipes.length}/${recipeTotal})`}
                    <span className="material-symbols-outlined">expand_more</span>
                  </button>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Pending Tab */}
        {tab === "pending" && (
          <section>
            <h2 className="font-bold text-on-surface mb-4">Onay Bekleyen Tarifler</h2>
            {pending.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 bg-white rounded-2xl border border-outline-variant/30">
                <span className="material-symbols-outlined text-primary text-4xl">check_circle</span>
                <strong className="text-on-surface">Onay bekleyen tarif yok</strong>
                <span className="text-sm text-on-surface-variant">Tüm tarifler işlenmiş.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((r) => (
                  <RecipeRow key={r.id} recipe={r} author={r.created_by_user_id ? userById.get(r.created_by_user_id)?.email : "Seed"}
                    onEdit={() => loadRecipeForEdit(r)} onApprove={() => approve(r)}
                    onReject={() => setConfirmReject(r)} onDelete={() => setConfirmDeleteRecipe(r)} roleOk={roleOk} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-on-surface">Kullanıcılar</h2>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
                <input className="pl-9 pr-4 py-2 bg-white border border-outline-variant/30 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary w-48" placeholder="Kullanıcı ara..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-outline-variant/30 divide-y divide-outline-variant/20 ambient-shadow overflow-hidden">
              {filteredUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-4 p-4 hover:bg-surface-container-low/50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 font-bold text-primary text-sm">
                    {(u.full_name?.[0] || u.email[0]).toUpperCase()}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="font-semibold text-sm text-on-surface truncate">{u.full_name || "İsimsiz kullanıcı"}</div>
                    <div className="text-xs text-on-surface-variant truncate">{u.email}</div>
                  </div>
                  <select
                    value={u.role}
                    disabled={!roleOk || u.id === me?.id}
                    onChange={(e) => updateUserRole(u, e.target.value)}
                    className="border border-outline-variant/50 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                  <button
                    className="p-2 rounded-lg text-error/70 hover:bg-error-container hover:text-error transition-colors disabled:opacity-30"
                    disabled={!roleOk || u.id === me?.id}
                    onClick={() => setConfirmDeleteUser(u)}
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Ingredients Tab */}
        {tab === "ingredients" && (
          <div className="space-y-6">
            <section className="bg-white rounded-2xl border border-outline-variant/30 p-6 ambient-shadow">
              <h2 className="font-bold text-on-surface mb-4">Yeni Malzeme</h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input className={inputClass} placeholder="Malzeme adı" value={newIngName} onChange={(e) => setNewIngName(e.target.value)} />
                <select className={inputClass} value={newIngCat} onChange={(e) => setNewIngCat(e.target.value ? Number(e.target.value) : "")}>
                  <option value="">Kategori seç</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input className={inputClass} placeholder="Birim (adet)" value={newIngUnit} onChange={(e) => setNewIngUnit(e.target.value)} />
                <button
                  className="bg-primary text-white py-2 px-4 rounded-xl font-semibold text-sm disabled:opacity-50 hover:bg-primary-container transition-colors"
                  disabled={!roleOk || !newIngName.trim()}
                  onClick={createIngredient}
                >
                  Ekle
                </button>
              </div>
            </section>
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-on-surface">Malzemeler ({filteredIngs.length})</h2>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
                  <input className="pl-9 pr-4 py-2 bg-white border border-outline-variant/30 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary w-48" placeholder="Ara..." value={ingSearch} onChange={(e) => setIngSearch(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {filteredIngs.map((i) => (
                  <div key={i.id} className="flex items-center gap-2 px-3 py-2 bg-white border border-outline-variant/30 rounded-xl text-sm hover:border-primary/30 transition-colors">
                    <div>
                      <strong className="text-on-surface text-xs">{i.name}</strong>
                      <span className="text-on-surface-variant text-[10px] ml-1">
                        {i.category_id ? catNameById.get(i.category_id) : "-"} / {i.unit_type}
                      </span>
                    </div>
                    <button className="text-error/50 hover:text-error transition-colors" disabled={!roleOk} onClick={() => deleteIngredient(i.id)}>
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Categories Tab */}
        {tab === "categories" && (
          <div className="space-y-6">
            <section className="bg-white rounded-2xl border border-outline-variant/30 p-6 ambient-shadow">
              <h2 className="font-bold text-on-surface mb-4">Yeni Kategori</h2>
              <div className="flex gap-3">
                <input
                  className={`${inputClass} flex-grow`}
                  placeholder="Kategori adı"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createCategory()}
                />
                <button
                  className="bg-primary text-white py-2 px-6 rounded-xl font-semibold text-sm disabled:opacity-50 hover:bg-primary-container transition-colors"
                  disabled={!roleOk || !newCat.trim()}
                  onClick={createCategory}
                >
                  Ekle
                </button>
              </div>
            </section>
            <div className="flex flex-wrap gap-3">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3 bg-white border border-outline-variant/30 rounded-xl hover:border-primary/30 transition-colors">
                  <div>
                    <strong className="text-sm text-on-surface">{c.name}</strong>
                    <span className="text-xs text-on-surface-variant ml-2">{ingredients.filter((i) => i.category_id === c.id).length} malzeme</span>
                  </div>
                  <button className="text-error/50 hover:text-error transition-colors" disabled={!roleOk} onClick={() => deleteCategory(c.id)}>
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <ConfirmModal isOpen={!!confirmReject} onClose={() => setConfirmReject(null)} onConfirm={() => confirmReject && reject(confirmReject)} title="Tarifi beklemeye al" message={`"${confirmReject?.title}" tarifini onaysız duruma almak istiyor musun?`} confirmLabel="Onaysız yap" confirmClass="btn danger" />
      <ConfirmModal isOpen={!!confirmDeleteRecipe} onClose={() => setConfirmDeleteRecipe(null)} onConfirm={() => confirmDeleteRecipe && deleteRecipe(confirmDeleteRecipe)} title="Tarifi sil" message={`"${confirmDeleteRecipe?.title}" tarifini kalıcı olarak silmek istiyor musun?`} confirmLabel="Sil" confirmClass="btn danger" />
      <ConfirmModal isOpen={!!confirmDeleteUser} onClose={() => setConfirmDeleteUser(null)} onConfirm={() => confirmDeleteUser && deleteUser(confirmDeleteUser)} title="Kullanıcıyı sil" message={`${confirmDeleteUser?.email} kullanıcısını silmek istiyor musun?`} confirmLabel="Sil" confirmClass="btn danger" />
    </div>
  );
}

function RecipeRow({ recipe, author, onEdit, onApprove, onReject, onDelete, roleOk }: {
  recipe: Recipe; author?: string; onEdit: () => void; onApprove: () => void;
  onReject: () => void; onDelete: () => void; roleOk: boolean;
}) {
  const photo = getRecipePhoto(recipe, 220, 220);
  return (
    <article className="bg-white rounded-xl border border-outline-variant/30 flex gap-4 p-4 hover:border-primary/20 transition-colors ambient-shadow">
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
        <img src={photo} alt={recipe.title} className="w-full h-full object-cover" loading="lazy" />
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm text-on-surface truncate">{recipe.title} <span className="text-on-surface-variant font-normal">#{recipe.id}</span></h3>
          <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${recipe.is_approved ? "bg-primary-fixed text-on-primary-fixed" : "bg-secondary-fixed text-on-secondary-fixed"}`}>
            {recipe.is_approved ? "Onaylı" : "Bekliyor"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-on-surface-variant mb-2">
          <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-xs">person</span>{author || "Seed"}</span>
          <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-xs">schedule</span>{recipe.cooking_time || 0} dk</span>
          <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-xs">favorite</span>{recipe.favorite_count}</span>
          <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-xs">bookmark</span>{recipe.save_count}</span>
        </div>
        <div className="flex items-center gap-1">
          <Link className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors" to={`/recipes/${recipe.id}`} title="Gör">
            <span className="material-symbols-outlined text-sm">visibility</span>
          </Link>
          <button className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-30" disabled={!roleOk} title="Düzenle" onClick={onEdit}>
            <span className="material-symbols-outlined text-sm">edit</span>
          </button>
          {recipe.is_approved ? (
            <button className="p-1.5 rounded-lg text-secondary/70 hover:bg-secondary-fixed/30 transition-colors disabled:opacity-30" disabled={!roleOk} title="Onayı kaldır" onClick={onReject}>
              <span className="material-symbols-outlined text-sm">undo</span>
            </button>
          ) : (
            <button className="p-1.5 rounded-lg text-primary/70 hover:bg-primary-fixed/30 transition-colors disabled:opacity-30" disabled={!roleOk} title="Onayla" onClick={onApprove}>
              <span className="material-symbols-outlined text-sm">check_circle</span>
            </button>
          )}
          <button className="p-1.5 rounded-lg text-error/50 hover:bg-error-container hover:text-error transition-colors disabled:opacity-30 ml-auto" disabled={!roleOk} title="Sil" onClick={onDelete}>
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      </div>
    </article>
  );
}
