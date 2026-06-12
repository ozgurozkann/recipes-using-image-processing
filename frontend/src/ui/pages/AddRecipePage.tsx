import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { toast, toastError } from "../components/Toast";
import { useLanguage } from "../i18n";

type Ingredient = { id: number; name: string; unit_type: string; category_id: number | null };
type Category = { id: number; name: string };

const inputClass = "w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/50 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary";

export default function AddRecipePage() {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingSearch, setIngSearch] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [cooking_time, setCookingTime] = useState(20);
  const [serving_count, setServingCount] = useState(2);
  const [difficulty, setDifficulty] = useState("easy");
  const [category_id, setCategoryId] = useState<number | null>(null);
  const [image_url, setImageUrl] = useState("");
  const [selected, setSelected] = useState<Record<number, { quantity: number; unit: string }>>({});
  const [newIngName, setNewIngName] = useState("");
  const [newIngUnit, setNewIngUnit] = useState(lang === "tr" ? "adet" : "pcs");
  const [addingIng, setAddingIng] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState(false);

  const STEPS = [t("add_step1"), t("add_step2"), t("add_step3")];

  useEffect(() => {
    Promise.all([
      api<{ items: Ingredient[] }>("GET", "/ingredients"),
      api<{ items: Category[] }>("GET", "/ingredients/categories"),
    ]).then(([a, b]) => { setIngredients(a.items); setCategories(b.items); }).catch(() => {});
  }, []);

  const filteredIngs = useMemo(() =>
    ingredients.filter((i) => !ingSearch || i.name.toLowerCase().includes(ingSearch.toLowerCase())),
    [ingredients, ingSearch]
  );

  const grouped = useMemo(() => {
    const map = new Map<number, Ingredient[]>();
    filteredIngs.forEach((i) => { const k = i.category_id || 0; map.set(k, [...(map.get(k) || []), i]); });
    return map;
  }, [filteredIngs]);

  function toggleIng(i: Ingredient) {
    setSelected((s) => { const n = { ...s }; if (n[i.id]) delete n[i.id]; else n[i.id] = { quantity: 1, unit: i.unit_type }; return n; });
  }

  async function addNewIngredient() {
    const name = newIngName.trim();
    if (!name) return;
    setAddingIng(true);
    try {
      const created = await api<Ingredient>("POST", "/ingredients/suggest", { name, unit_type: newIngUnit, category_id: null });
      setIngredients((prev) => prev.some((x) => x.id === created.id) ? prev : [...prev, created]);
      setSelected((s) => ({ ...s, [created.id]: { quantity: 1, unit: created.unit_type } }));
      setIngSearch("");
      setNewIngName("");
      setNewIngUnit(lang === "tr" ? "adet" : "pcs");
      toast(lang === "tr" ? "Malzeme eklendi" : "Ingredient added", `"${created.name}" ${lang === "tr" ? "listeye eklendi ve seçildi." : "was added and selected."}`);
    } catch (e: any) {
      toastError(lang === "tr" ? "Hata" : "Error", e.message);
    } finally {
      setAddingIng(false);
    }
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
      toastError(lang === "tr" ? "Yükleme hatası" : "Upload error", err.message);
    } finally {
      setImgUploading(false);
      e.target.value = "";
    }
  }

  async function submit() {
    if (!title.trim()) { toastError(lang === "tr" ? "Başlık gerekli" : "Title required", lang === "tr" ? "Lütfen tarif adını girin." : "Please enter the recipe name."); return; }
    setLoading(true);
    try {
      const payload = {
        title: title.trim(), description, instructions, cooking_time, serving_count,
        difficulty, category_id, image_url,
        ingredients: Object.entries(selected).map(([id, v]) => ({ ingredient_id: Number(id), quantity: v.quantity, unit: v.unit })),
      };
      await api<{ id: number }>("POST", "/recipes", payload);
      setSubmitted(true);
      setTimeout(() => navigate("/"), 3000);
    } catch (e: any) {
      toastError(lang === "tr" ? "Hata" : "Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedCount = Object.keys(selected).length;
  const diffLabel = (d: string) => ({ easy: t("diff_easy"), medium: t("diff_medium"), hard: t("diff_hard") }[d] ?? d);

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: "linear-gradient(135deg, var(--md-sys-color-primary-fixed) 0%, #fff 60%)" }}>
        <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 mb-8 animate-bounce" style={{ animationDuration: "1.2s", animationIterationCount: 1 }}>
          <span className="material-symbols-outlined text-white" style={{ fontSize: 48 }}>check</span>
        </div>
        <h1 className="text-3xl font-bold text-on-surface mb-3">{t("add_success_h1")}</h1>
        <p className="text-on-surface-variant text-base max-w-sm mb-2">
          {t("add_success_p1")}
        </p>
        <p className="text-on-surface-variant text-sm max-w-sm mb-10">
          {t("add_success_p2")}
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-sm">home</span>{t("add_success_home")}
        </button>
        <p className="text-xs text-on-surface-variant mt-6 opacity-60">{t("add_success_redirect")}</p>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <main className="pt-8 max-w-5xl mx-auto px-5 md:px-16">

        {/* Hero */}
        <section className="mb-8">
          <span className="text-label-caps font-semibold text-secondary tracking-widest uppercase mb-2 block">{t("add_eyebrow")}</span>
          <h1 className="text-display-lg-mobile md:text-display-lg font-bold text-on-surface tracking-tight mb-2">
            {t("add_h1")}
          </h1>
          <p className="text-on-surface-variant text-body-lg">{t("add_subtitle")}</p>
        </section>

        {/* Step Indicator */}
        <div className="flex items-center mb-8 bg-white rounded-2xl border border-outline-variant/30 p-5 ambient-shadow">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`flex items-center gap-3 cursor-pointer transition-all ${i < step ? "cursor-pointer" : "cursor-default"}`}
                onClick={() => i < step && setStep(i)}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${step > i ? "bg-primary text-white" : step === i ? "bg-primary text-white ring-4 ring-primary/20" : "bg-surface-container-high text-on-surface-variant"}`}>
                  {step > i ? <span className="material-symbols-outlined text-sm">check</span> : i + 1}
                </div>
                <span className={`text-sm font-semibold hidden sm:block ${step >= i ? "text-on-surface" : "text-on-surface-variant"}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 rounded-full transition-colors ${step > i ? "bg-primary" : "bg-outline-variant/40"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Basic Info */}
        {step === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 ambient-shadow space-y-4">
              <h3 className="font-bold text-on-surface">{t("add_basic_h3")}</h3>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{t("add_title_label")}</label>
                <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("add_title_ph")} autoFocus />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{t("add_desc_label")}</label>
                <textarea className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder={t("add_desc_ph")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{t("add_time_label")}</label>
                  <input className={inputClass} type="number" min={1} value={cooking_time} onChange={(e) => setCookingTime(Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{t("add_serving_label")}</label>
                  <input className={inputClass} type="number" min={1} value={serving_count} onChange={(e) => setServingCount(Number(e.target.value))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{t("add_diff_label")}</label>
                  <select className={inputClass} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    <option value="easy">{t("diff_easy")}</option>
                    <option value="medium">{t("diff_medium")}</option>
                    <option value="hard">{t("diff_hard")}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{t("add_cat_label")}</label>
                  <select className={inputClass} value={category_id ?? ""} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}>
                    <option value="">{t("add_cat_none")}</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{t("add_img_label")}</label>
                <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                {image_url ? (
                  <div className="relative rounded-xl overflow-hidden border border-outline-variant/50">
                    <img src={image_url} alt="" className="w-full h-36 object-cover" />
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
                    className="w-full py-6 border-2 border-dashed border-outline-variant/50 rounded-xl flex flex-col items-center gap-2 text-on-surface-variant hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-60"
                  >
                    {imgUploading
                      ? <><span className="spinner" style={{ width: 20, height: 20 }} /><span className="text-xs">{t("add_uploading")}</span></>
                      : <><span className="material-symbols-outlined text-2xl">add_photo_alternate</span><span className="text-xs font-medium">{t("add_upload_photo")}</span></>
                    }
                  </button>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="glass-card rounded-2xl p-6 ambient-shadow flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-on-surface mb-4">{t("add_summary_h3")}</h3>
                <div className="space-y-3 text-sm">
                  {[
                    { label: t("add_sum_title"), value: title || "—" },
                    { label: t("add_sum_time"), value: `${cooking_time} ${t("unit_dk")}` },
                    { label: t("add_sum_serving"), value: `${serving_count} ${t("unit_kisi")}` },
                    { label: t("add_sum_diff"), value: diffLabel(difficulty) },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between py-2 border-b border-outline-variant/20">
                      <span className="text-on-surface-variant font-medium">{row.label}</span>
                      <span className="font-semibold text-primary">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                className="w-full mt-8 bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                onClick={() => setStep(1)}
                disabled={!title.trim()}
              >
                {t("add_next_ingredients")} <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Ingredients */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 bg-white rounded-2xl border border-outline-variant/30 p-6 ambient-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-on-surface">{t("add_ing_h3")}</h3>
                {selectedCount > 0 && (
                  <span className="px-3 py-1 bg-primary-fixed/50 text-primary text-xs font-bold rounded-full">{selectedCount} {t("add_count")}</span>
                )}
              </div>
              <div className="relative mb-4">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
                <input className={`${inputClass} pl-9`} placeholder={t("add_ing_search_ph")} value={ingSearch} onChange={(e) => setIngSearch(e.target.value)} />
              </div>
              {ingSearch.trim() && filteredIngs.length === 0 && (
                <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    "{ingSearch}" {t("add_not_found_prefix")}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{t("add_ing_name_label")}</label>
                      <input
                        className={inputClass}
                        value={newIngName || ingSearch}
                        onChange={(e) => setNewIngName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{t("add_ing_unit_label")}</label>
                      <input
                        className={inputClass}
                        value={newIngUnit}
                        onChange={(e) => setNewIngUnit(e.target.value)}
                        placeholder={t("add_ing_unit_ph")}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => { if (!newIngName) setNewIngName(ingSearch); addNewIngredient(); }}
                    disabled={addingIng}
                    className="w-full py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {addingIng
                      ? <><span className="spinner" style={{ width: 12, height: 12 }} />{t("add_ing_adding")}</>
                      : <><span className="material-symbols-outlined text-sm">add</span>{t("add_ing_add_btn")}</>
                    }
                  </button>
                </div>
              )}

              <div className="max-h-[50vh] overflow-y-auto custom-scrollbar space-y-4 pr-1">
                {categories.map((c) => {
                  const list = grouped.get(c.id) || [];
                  if (!list.length) return null;
                  return (
                    <div key={c.id}>
                      <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">{c.name}</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {list.map((i) => {
                          const picked = selected[i.id];
                          return (
                            <div key={i.id}
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
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-4 flex flex-col gap-4">
              <div className="bg-white rounded-2xl border border-outline-variant/30 p-5 ambient-shadow flex-grow">
                <h3 className="font-bold text-on-surface mb-3">{t("add_selected_h3")}</h3>
                {selectedCount === 0 ? (
                  <p className="text-on-surface-variant text-sm">{t("add_none_selected")}</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {Object.entries(selected).map(([id, v]) => {
                      const ing = ingredients.find((x) => x.id === Number(id));
                      return (
                        <div key={id} className="flex justify-between items-center px-3 py-2 bg-surface-container-low rounded-lg text-xs">
                          <span className="font-medium text-on-surface">{ing?.name}</span>
                          <span className="text-on-surface-variant">{v.quantity} {v.unit}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface-variant text-sm font-semibold hover:bg-surface-container-low transition-colors flex items-center justify-center gap-1" onClick={() => setStep(0)}>
                  <span className="material-symbols-outlined text-sm">arrow_back</span>{t("add_back")}
                </button>
                <button className="flex-2 bg-primary text-white py-3 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-1 hover:bg-primary-container transition-colors" onClick={() => setStep(2)}>
                  {t("add_to_instructions")} <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Instructions */}
        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 bg-white rounded-2xl border border-outline-variant/30 p-6 ambient-shadow">
              <h3 className="font-bold text-on-surface mb-2">{t("add_inst_h3")}</h3>
              <p className="text-on-surface-variant text-sm mb-4">{t("add_inst_desc")}</p>
              <textarea
                className={`${inputClass} min-h-[200px]`}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={10}
                placeholder={t("add_inst_ph")}
              />
              {instructions && (
                <div className="mt-6">
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">{t("add_preview_label")}</p>
                  <div className="space-y-3">
                    {instructions.split("\n").filter(Boolean).map((s, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="w-7 h-7 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-sm text-on-surface-variant leading-relaxed pt-0.5">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-4 flex flex-col gap-4">
              <div className="glass-card rounded-2xl p-5 ambient-shadow">
                <h3 className="font-bold text-on-surface mb-4">{t("add_summary2_h3")}</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: t("add_sum2_title"), value: title },
                    { label: t("add_sum2_time"), value: `${cooking_time} ${t("unit_dk")}` },
                    { label: t("add_sum2_serving"), value: `${serving_count} ${t("unit_kisi")}` },
                    { label: t("add_sum2_ing"), value: `${selectedCount} ${t("add_adet")}` },
                    { label: t("add_sum2_step"), value: `${instructions.split("\n").filter(Boolean).length} ${t("add_adet")}` },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between py-1.5 border-b border-outline-variant/20">
                      <span className="text-on-surface-variant">{row.label}</span>
                      <span className="font-semibold text-primary">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface-variant text-sm font-semibold hover:bg-surface-container-low transition-colors flex items-center justify-center gap-1" onClick={() => setStep(1)}>
                  <span className="material-symbols-outlined text-sm">arrow_back</span>{t("add_back")}
                </button>
                <button
                  className="flex-2 bg-primary text-white py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-container transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                  onClick={submit}
                  disabled={loading}
                >
                  {loading ? <><span className="spinner" />{t("add_publishing")}</> : <><span className="material-symbols-outlined text-sm">publish</span>{t("add_publish")}</>}
                </button>
              </div>
            </div>
          </div>
        )}
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
