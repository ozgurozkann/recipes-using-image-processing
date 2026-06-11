import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { toast, toastError } from "../components/Toast";

type Ingredient = { id: number; name: string; unit_type: string; category_id: number | null };
type Category = { id: number; name: string };
type RecipeIngredient = { ingredient_id: number; name: string; quantity: number; unit: string };
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
  is_approved: boolean;
  ingredients: RecipeIngredient[];
};

const inputClass = "w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary";

export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [initLoading, setInitLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // Ingredient catalog
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingSearch, setIngSearch] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [cookingTime, setCookingTime] = useState(20);
  const [servingCount, setServingCount] = useState(2);
  const [difficulty, setDifficulty] = useState("easy");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [selected, setSelected] = useState<Record<number, { quantity: number; unit: string }>>({});

  useEffect(() => {
    Promise.all([
      api<Recipe>( "GET", `/recipes/${id}`),
      api<{ items: Ingredient[] }>("GET", "/ingredients"),
      api<{ items: Category[] }>("GET", "/ingredients/categories"),
    ])
      .then(([recipe, { items: ings }, { items: cats }]) => {
        setTitle(recipe.title);
        setDescription(recipe.description ?? "");
        setInstructions(recipe.instructions ?? "");
        setCookingTime(recipe.cooking_time ?? 20);
        setServingCount(recipe.serving_count ?? 2);
        setDifficulty(recipe.difficulty ?? "easy");
        setCategoryId(recipe.category_id ?? null);
        setImageUrl(recipe.image_url ?? "");
        const sel: Record<number, { quantity: number; unit: string }> = {};
        recipe.ingredients.forEach((i) => { sel[i.ingredient_id] = { quantity: i.quantity, unit: i.unit }; });
        setSelected(sel);
        setIngredients(ings);
        setCategories(cats);
      })
      .catch((e) => { toastError("Hata", e.message); navigate("/my-recipes"); })
      .finally(() => setInitLoading(false));
  }, [id]);

  const filteredIngs = useMemo(
    () => ingredients.filter((i) => !ingSearch || i.name.toLowerCase().includes(ingSearch.toLowerCase())),
    [ingredients, ingSearch],
  );

  const grouped = useMemo(() => {
    const map = new Map<number, Ingredient[]>();
    filteredIngs.forEach((i) => {
      const k = i.category_id ?? 0;
      map.set(k, [...(map.get(k) ?? []), i]);
    });
    return map;
  }, [filteredIngs]);

  function toggleIng(i: Ingredient) {
    setSelected((s) => {
      const n = { ...s };
      if (n[i.id]) delete n[i.id]; else n[i.id] = { quantity: 1, unit: i.unit_type };
      return n;
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api<{ url: string }>("POST", "/recipes/upload-image", fd, true);
      setImageUrl(res.url);
    } catch (err: any) {
      toastError("Yükleme hatası", err.message);
    } finally {
      setImgUploading(false);
      e.target.value = "";
    }
  }

  async function save() {
    if (!title.trim()) { toastError("Başlık gerekli", "Lütfen tarif adını girin."); return; }
    setSaving(true);
    try {
      await api("PUT", `/recipes/${id}`, {
        title: title.trim(),
        description,
        instructions,
        cooking_time: cookingTime,
        serving_count: servingCount,
        difficulty,
        category_id: categoryId,
        image_url: imageUrl,
        ingredients: Object.entries(selected).map(([ingId, v]) => ({
          ingredient_id: Number(ingId),
          quantity: v.quantity,
          unit: v.unit,
        })),
      });
      toast("Kaydedildi", "Tarif güncellendi.");
      navigate("/my-recipes");
    } catch (e: any) {
      toastError("Hata", e.message);
    } finally {
      setSaving(false);
    }
  }

  if (initLoading) {
    return (
      <div className="page-loader">
        <span className="spinner spinner-primary" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  const selectedCount = Object.keys(selected).length;

  return (
    <div className="pb-20">
      <main className="pt-8 max-w-6xl mx-auto px-5 md:px-16">

        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 mb-3 text-on-surface-variant/60 text-xs font-semibold uppercase tracking-wider">
            <Link to="/" className="hover:text-primary transition-colors">Ana Sayfa</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <Link to="/my-recipes" className="hover:text-primary transition-colors">Tariflerim</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-primary font-bold">Düzenle</span>
          </nav>
          <h1 className="text-display-lg-mobile md:text-display-lg font-bold text-on-surface tracking-tight">
            Tarifi Düzenle
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT: Basic Info */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 ambient-shadow space-y-4">
              <h3 className="font-bold text-on-surface">Temel Bilgiler</h3>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Tarif Adı *</label>
                <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Açıklama</label>
                <textarea className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Süre (dk)</label>
                  <input className={inputClass} type="number" min={1} value={cookingTime} onChange={(e) => setCookingTime(Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Porsiyon</label>
                  <input className={inputClass} type="number" min={1} value={servingCount} onChange={(e) => setServingCount(Number(e.target.value))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Zorluk</label>
                  <select className={inputClass} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="easy">Kolay</option>
                    <option value="medium">Orta</option>
                    <option value="hard">Zor</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Kategori</label>
                  <select className={inputClass} value={categoryId ?? ""} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}>
                    <option value="">— Seç —</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Image */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Görsel</label>
                <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                {imageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-outline-variant/50">
                    <img src={imageUrl} alt="Önizleme" className="w-full h-36 object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      <span className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>close</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imgInputRef.current?.click()}
                    disabled={imgUploading}
                    className="w-full py-5 border-2 border-dashed border-outline-variant/50 rounded-xl flex flex-col items-center gap-2 text-on-surface-variant hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-60"
                  >
                    {imgUploading
                      ? <><span className="spinner" style={{ width: 18, height: 18 }} /><span className="text-xs">Yükleniyor…</span></>
                      : <><span className="material-symbols-outlined text-2xl">add_photo_alternate</span><span className="text-xs font-medium">Fotoğraf yükle</span></>
                    }
                  </button>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 ambient-shadow space-y-3">
              <h3 className="font-bold text-on-surface">Hazırlanış</h3>
              <textarea
                className={`${inputClass} min-h-[160px]`}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={8}
                placeholder={"1. Soğanı doğrayıp kavurun.\n2. Malzemeleri ekleyin…"}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Link
                to="/my-recipes"
                className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface-variant text-sm font-semibold hover:bg-surface-container-low transition-colors flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                İptal
              </Link>
              <button
                className="flex-2 bg-primary text-white py-3 px-8 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                onClick={save}
                disabled={saving}
              >
                {saving
                  ? <><span className="spinner" />Kaydediliyor…</>
                  : <><span className="material-symbols-outlined text-sm">save</span>Kaydet</>
                }
              </button>
            </div>
          </div>

          {/* RIGHT: Ingredient Picker */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 ambient-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-on-surface">Malzemeler</h3>
                {selectedCount > 0 && (
                  <span className="px-3 py-1 bg-primary-fixed/50 text-primary text-xs font-bold rounded-full">
                    {selectedCount} seçili
                  </span>
                )}
              </div>

              <div className="relative mb-4">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
                <input
                  className={`${inputClass} pl-9`}
                  placeholder="Malzeme ara…"
                  value={ingSearch}
                  onChange={(e) => setIngSearch(e.target.value)}
                />
              </div>

              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4 pr-1">
                {categories.map((c) => {
                  const list = grouped.get(c.id) ?? [];
                  if (!list.length) return null;
                  return (
                    <div key={c.id}>
                      <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">{c.name}</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {list.map((i) => {
                          const picked = selected[i.id];
                          return (
                            <div
                              key={i.id}
                              className={`p-3 rounded-xl border cursor-pointer transition-all ${picked ? "border-primary bg-primary-fixed/30" : "border-outline-variant/50 hover:border-primary/30 bg-surface-container-low"}`}
                              onClick={() => toggleIng(i)}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${picked ? "bg-primary border-primary" : "border-outline-variant"}`}>
                                  {picked && <span className="material-symbols-outlined text-white" style={{ fontSize: 10 }}>check</span>}
                                </div>
                                <span className="text-xs font-medium text-on-surface truncate">{i.name}</span>
                              </div>
                              {picked && (
                                <div className="grid grid-cols-2 gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="number" min={0}
                                    value={picked.quantity}
                                    onChange={(e) => setSelected((s) => ({ ...s, [i.id]: { ...s[i.id], quantity: Number(e.target.value) } }))}
                                    className="border border-outline-variant/50 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                                  />
                                  <input
                                    value={picked.unit}
                                    onChange={(e) => setSelected((s) => ({ ...s, [i.id]: { ...s[i.id], unit: e.target.value } }))}
                                    className="border border-outline-variant/50 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected summary */}
            {selectedCount > 0 && (
              <div className="bg-white rounded-2xl border border-outline-variant/30 p-5 ambient-shadow">
                <h4 className="font-bold text-on-surface text-sm mb-3">Seçilen Malzemeler</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                  {Object.entries(selected).map(([ingId, v]) => {
                    const ing = ingredients.find((x) => x.id === Number(ingId));
                    return (
                      <div key={ingId} className="flex justify-between items-center px-3 py-2 bg-surface-container-low rounded-lg text-xs">
                        <span className="font-medium text-on-surface">{ing?.name}</span>
                        <span className="text-on-surface-variant">{v.quantity} {v.unit}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="culina-footer mt-12">
        <div className="culina-footer-inner">
          <span className="font-bold text-primary">Recipe AI</span>
          <p className="text-xs text-on-surface-variant opacity-50">© 2024 Recipe AI.</p>
        </div>
      </footer>
    </div>
  );
}
