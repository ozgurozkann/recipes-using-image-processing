import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { getToken } from "../authStore";
import { toastError, toast } from "../components/Toast";
import { getRecipePhoto } from "../recipePhotos";

type SelectedImage = { file: File; preview: string };
type DetectedIng = { name: string; confidence: number; source?: string | null };
type Ingredient = { id: number; name: string; category_id: number | null; unit_type: string };
type Category = { id: number; name: string };
type RecItem = {
  recipeId: number;
  title: string;
  difficulty?: string;
  cooking_time?: number;
  serving_count?: number;
  image_url?: string;
  matchScore: number;
  matchedIngredients: string[];
  missingIngredients: string[];
  favoriteCount: number;
  saveCount: number;
};
type Selected = Record<number, boolean>;

const CAT_ICONS: Record<string, string> = {
  "Sebzeler": "yard", "Meyveler": "nutrition", "Baharatlar": "eco",
  "Bakliyat": "grain", "Süt Ürünleri": "egg", "Etler": "dinner_dining",
  "Deniz Ürünleri": "set_meal", "Tahıllar": "grass", "Yağlar": "water_drop",
};

const PAGE_SIZE = 12;

function imageKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export default function CombinedRecommendPage() {
  const [activeTab, setActiveTab] = useState<"photo" | "manual">("photo");

  // Photo state
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<SelectedImage[]>([]);

  // Manual state
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Selected>({});
  const [ingSearch, setIngSearch] = useState("");
  const [openCats, setOpenCats] = useState<Set<number>>(new Set());
  const [initLoading, setInitLoading] = useState(true);

  // Results state
  const [items, setItems] = useState<RecItem[]>([]);
  const [detected, setDetected] = useState<DetectedIng[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Cleanup object URLs on unmount
  useEffect(() => { previewsRef.current = images; }, [images]);
  useEffect(() => {
    return () => { previewsRef.current.forEach((img) => URL.revokeObjectURL(img.preview)); };
  }, []);

  // Load ingredients + categories
  useEffect(() => {
    Promise.all([
      api<{ items: Ingredient[] }>("GET", "/ingredients"),
      api<{ items: Category[] }>("GET", "/ingredients/categories"),
    ])
      .then(([a, b]) => { setIngredients(a.items); setCategories(b.items); })
      .catch((e) => toastError("Yükleme Hatası", e.message))
      .finally(() => setInitLoading(false));
  }, []);

  // Photo handlers
  function handleFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (incoming.length === 0) return;
    setImages((cur) => {
      const known = new Set(cur.map((img) => imageKey(img.file)));
      const additions = incoming
        .filter((f) => !known.has(imageKey(f)))
        .map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
      return [...cur, ...additions];
    });
  }

  function removeImage(index: number) {
    setImages((cur) => {
      const next = [...cur];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.preview);
      return next;
    });
  }

  // Manual ingredient handlers
  const deferredSearch = useDeferredValue(ingSearch);
  const byCat = useMemo(() => {
    const map = new Map<number, Ingredient[]>();
    const q = deferredSearch.trim().toLocaleLowerCase("tr-TR");
    ingredients.forEach((i) => {
      if (q && !i.name.toLocaleLowerCase("tr-TR").includes(q)) return;
      const k = i.category_id ?? 0;
      const list = map.get(k);
      if (list) list.push(i); else map.set(k, [i]);
    });
    return map;
  }, [ingredients, deferredSearch]);

  const toggle = useCallback((ing: Ingredient) => {
    setSelected((s) => {
      const next = { ...s };
      if (next[ing.id]) delete next[ing.id]; else next[ing.id] = true;
      return next;
    });
  }, []);

  const toggleCat = useCallback((id: number) => {
    setOpenCats((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const selectedIds = useMemo(() => Object.keys(selected).map(Number), [selected]);
  const selectedCount = selectedIds.length;
  const selectedNames = useMemo(
    () => selectedIds.map((id) => ingredients.find((i) => i.id === id)?.name ?? "").filter(Boolean),
    [selectedIds, ingredients],
  );

  const canSearch = images.length > 0 || selectedCount > 0;

  async function doSearch() {
    if (!canSearch) return;
    if (images.length > 0 && !getToken()) {
      toast("Giriş gerekli", "Fotoğraf yüklemek için lütfen giriş yapın.");
      return;
    }
    setLoading(true);
    setDetected([]);
    setItems([]);
    setVisibleCount(PAGE_SIZE);
    try {
      const fd = new FormData();
      images.forEach((img) => fd.append("files", img.file));
      fd.append("ingredient_ids", JSON.stringify(selectedIds));
      const out = await api<{ items: RecItem[]; detectedIngredients: DetectedIng[] }>(
        "POST", "/recommendations/combined", fd, true,
      );
      setDetected(out.detectedIngredients ?? []);
      setItems(out.items ?? []);
      if (out.items.length === 0) {
        toast("Sonuç bulunamadı", "Farklı malzemeler seçip tekrar deneyin.");
      }
    } catch (e: any) {
      toastError("Hata", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-20">
      <main className="pt-8 pb-4 max-w-7xl mx-auto px-5 md:px-16">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-6 text-on-surface-variant/60 text-xs font-semibold uppercase tracking-wider">
          <Link to="/" className="hover:text-primary transition-colors">Ana Sayfa</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary font-bold">Tarif Öneri</span>
        </nav>

        {/* Hero */}
        <section className="mb-8">
          <h1 className="text-display-lg-mobile md:text-display-lg font-bold text-on-surface tracking-tight mb-2">
            Malzeme ile <span className="text-primary">Tarif Bul</span>
          </h1>
          <p className="text-on-surface-variant text-body-lg max-w-2xl leading-relaxed">
            Fotoğraf yükle, manuel malzeme seç veya ikisini birden kullan — tek tıkla tarif önerisi al.
          </p>
        </section>

        {/* Mobile tab switcher */}
        <div className="flex md:hidden gap-1 mb-5 p-1 bg-surface-container rounded-xl">
          <button
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === "photo" ? "bg-white shadow text-primary" : "text-on-surface-variant"}`}
            onClick={() => setActiveTab("photo")}
          >
            <span className="material-symbols-outlined text-sm">photo_camera</span>
            Fotoğraf
            {images.length > 0 && <span className="bg-secondary text-white text-[10px] font-bold px-1.5 rounded-full">{images.length}</span>}
          </button>
          <button
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === "manual" ? "bg-white shadow text-primary" : "text-on-surface-variant"}`}
            onClick={() => setActiveTab("manual")}
          >
            <span className="material-symbols-outlined text-sm">checklist</span>
            Manuel
            {selectedCount > 0 && <span className="bg-primary text-white text-[10px] font-bold px-1.5 rounded-full">{selectedCount}</span>}
          </button>
        </div>

        {/* Two-panel layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* LEFT: Photo Upload */}
          <div className={`flex flex-col gap-4 ${activeTab === "manual" ? "hidden md:flex" : "flex"}`}>
            <div className="flex items-center gap-3 mb-1">
              <span className="material-symbols-outlined text-secondary text-3xl">photo_camera</span>
              <h2 className="text-xl font-bold text-on-surface tracking-tight">
                Fotoğraf ile <span className="text-secondary">Öneri</span>
              </h2>
            </div>
            <p className="text-on-surface-variant text-sm -mt-2 mb-1">
              Birden fazla malzeme fotoğrafı yükle, her biri ayrı analiz edilsin ve hepsini içeren tarifler gelsin.
            </p>

            {/* Drop zone */}
            <div
              className={`glass-card rounded-[24px] p-10 flex flex-col items-center text-center cursor-pointer transition-all group relative overflow-hidden min-h-[260px] justify-center ${dragging ? "border-primary/40 bg-primary/5" : "hover:border-primary/20"}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => inputRef.current?.click()}
            >
              {/* Scan line */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[24px]">
                <div
                  className="w-full h-1 bg-primary/30 absolute top-0 shadow-[0_0_15px_rgba(21,66,18,0.5)]"
                  style={{ animation: "scan 3s ease-in-out infinite" }}
                />
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.currentTarget.value = ""; }}
              />

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 mb-5 bg-primary-fixed/40 rounded-full flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                  <span className="material-symbols-outlined text-primary text-4xl" style={{ animation: "pulse 2s infinite" }}>
                    center_focus_strong
                  </span>
                </div>
                <h3 className="font-bold text-on-surface mb-1">
                  {images.length > 0 ? `${images.length} fotoğraf seçildi` : "AI Tarayıcıyı Başlat"}
                </h3>
                <p className="text-on-surface-variant text-sm">
                  {images.length > 0
                    ? `${(images.reduce((s, i) => s + i.file.size, 0) / 1024).toFixed(0)} KB · JPG, PNG, WEBP`
                    : "Görselleri buraya sürükleyin veya tıklayın"}
                </p>
                <div className="mt-3">
                  <span className="px-3 py-1 bg-surface-container-highest rounded-full text-[10px] font-bold tracking-widest uppercase opacity-60">
                    Neural Engine Active
                  </span>
                </div>
              </div>
            </div>

            {/* Image preview grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, idx) => (
                  <figure key={imageKey(img.file)} className="relative rounded-xl overflow-hidden aspect-square">
                    <img src={img.preview} alt={img.file.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                      onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                    >
                      <span className="material-symbols-outlined text-white" style={{ fontSize: 13 }}>close</span>
                    </button>
                  </figure>
                ))}
                <div
                  className="rounded-xl border-2 border-dashed border-outline-variant/50 flex items-center justify-center aspect-square cursor-pointer hover:border-secondary/40 transition-colors"
                  onClick={() => inputRef.current?.click()}
                >
                  <span className="material-symbols-outlined text-on-surface-variant/30 text-2xl">add</span>
                </div>
              </div>
            )}

            {/* Detected ingredients post-search */}
            {detected.length > 0 && (
              <div className="bg-white rounded-2xl border border-outline-variant p-4 ambient-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-secondary text-sm">travel_explore</span>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-outline">Fotoğraftan Tespit Edilenler</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {detected.map((d) => (
                    <span
                      key={`${d.name}-${d.source ?? ""}`}
                      className="flex items-center gap-1 px-2.5 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full"
                    >
                      {d.name}
                      <span className="opacity-50 text-[10px]">{Math.round(d.confidence * 100)}%</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Manual Ingredient Picker */}
          <div className={`flex flex-col gap-3 ${activeTab === "photo" ? "hidden md:flex" : "flex"}`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-lg">checklist</span>
              </div>
              <h2 className="font-bold text-on-surface">Manuel Seç</h2>
              {selectedCount > 0 && (
                <span className="ml-auto text-xs bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full">
                  {selectedCount} seçili
                </span>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl">search</span>
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant rounded-xl focus:ring-1 focus:ring-primary text-sm placeholder:text-outline outline-none"
                placeholder="Malzeme ara..."
                value={ingSearch}
                onChange={(e) => setIngSearch(e.target.value)}
              />
              {ingSearch && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                  onClick={() => setIngSearch("")}
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>

            {/* Categories accordion */}
            {initLoading ? (
              <div className="flex justify-center py-8">
                <span className="spinner spinner-primary" style={{ width: 28, height: 28 }} />
              </div>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar" style={{ maxHeight: "52vh" }}>
                {categories.map((c) => {
                  const list = byCat.get(c.id) ?? [];
                  if (list.length === 0) return null;
                  const isOpen = openCats.has(c.id) || !!deferredSearch.trim();
                  const icon = CAT_ICONS[c.name] ?? "eco";
                  const selInCat = list.filter((i) => selected[i.id]).length;

                  return (
                    <div key={c.id} className="bg-white rounded-2xl border border-outline-variant p-3 ambient-shadow">
                      <button className="w-full flex items-center justify-between" onClick={() => toggleCat(c.id)}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-sm">{icon}</span>
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-sm text-on-surface">{c.name}</div>
                            <div className="text-[10px] text-on-surface-variant">
                              {list.length} malzeme{selInCat > 0 && ` · ${selInCat} seçili`}
                            </div>
                          </div>
                        </div>
                        <span
                          className="material-symbols-outlined text-outline-variant text-sm transition-transform"
                          style={{ transform: isOpen ? "rotate(90deg)" : "none" }}
                        >
                          arrow_forward_ios
                        </span>
                      </button>

                      {isOpen && (
                        <div className="grid grid-cols-2 gap-1.5 mt-3 pt-3 border-t border-outline-variant/30">
                          {list.map((ing) => (
                            <IngChip key={ing.id} ing={ing} picked={!!selected[ing.id]} onToggle={toggle} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sticky summary + search bar */}
        <div className="sticky bottom-5 z-20 mt-2">
          <div className="bg-white rounded-[20px] border border-outline-variant p-4 ambient-shadow flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              {canSearch ? (
                <div className="flex flex-wrap gap-2 items-center">
                  {images.length > 0 && (
                    <span className="flex items-center gap-1 px-3 py-1 bg-secondary/10 text-secondary text-xs font-semibold rounded-full">
                      <span className="material-symbols-outlined text-xs">photo_camera</span>
                      {images.length} fotoğraf
                    </span>
                  )}
                  {selectedNames.slice(0, 6).map((name) => (
                    <span key={name} className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                      {name}
                    </span>
                  ))}
                  {selectedCount > 6 && (
                    <span className="text-xs text-on-surface-variant">+{selectedCount - 6} daha</span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant">
                  Fotoğraf yükle veya malzeme seç — ardından tarif ara
                </p>
              )}
            </div>

            <button
              className="flex-shrink-0 bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary-container transition-all active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-50 whitespace-nowrap"
              disabled={loading || !canSearch}
              onClick={doSearch}
            >
              {loading ? (
                <><span className="spinner" /> Aranıyor…</>
              ) : (
                <><span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>Tarif Ara</>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {(items.length > 0 || loading) && (
          <section className="mt-10">
            {loading ? (
              <div className="flex justify-center py-12">
                <span className="spinner spinner-primary" style={{ width: 36, height: 36 }} />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-headline-md text-on-surface">{items.length} Tarif Önerisi</h2>
                  <span className="text-xs text-on-surface-variant">
                    {Math.min(visibleCount, items.length)}/{items.length} gösteriliyor
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {items.slice(0, visibleCount).map((item) => (
                    <ResultCard key={item.recipeId} item={item} />
                  ))}
                </div>
                {visibleCount < items.length && (
                  <div className="flex justify-center mt-8">
                    <button
                      className="flex items-center gap-2 text-primary font-semibold hover:underline"
                      onClick={() => setVisibleCount((c) => Math.min(c + PAGE_SIZE, items.length))}
                    >
                      Daha Fazla Göster
                      <span className="material-symbols-outlined">expand_more</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>

      <footer className="culina-footer mt-8">
        <div className="culina-footer-inner">
          <span className="font-bold text-primary">Recipe AI</span>
          <p className="text-xs text-on-surface-variant opacity-50">© 2024 Recipe AI.</p>
        </div>
      </footer>
    </div>
  );
}

const IngChip = memo(function IngChip({
  ing, picked, onToggle,
}: { ing: Ingredient; picked: boolean; onToggle: (i: Ingredient) => void }) {
  return (
    <button
      className={`p-2.5 rounded-xl border text-left w-full transition-all ${picked ? "border-primary bg-primary-fixed/30" : "border-outline-variant/50 bg-surface-container-low hover:border-primary/30"}`}
      onClick={() => onToggle(ing)}
    >
      <div className="flex items-center gap-2">
        <div className={`w-3.5 h-3.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${picked ? "bg-primary border-primary" : "border-outline-variant"}`}>
          {picked && <span className="material-symbols-outlined text-white" style={{ fontSize: 9 }}>check</span>}
        </div>
        <span className="text-xs font-medium text-on-surface truncate">{ing.name}</span>
      </div>
    </button>
  );
});

function ResultCard({ item }: { item: RecItem }) {
  const photo = getRecipePhoto(
    { id: item.recipeId, title: item.title, image_url: item.image_url } as any,
    640, 420,
  );
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
        <div className="flex gap-2 text-xs text-on-surface-variant mb-2">
          {item.cooking_time ? (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">schedule</span>{item.cooking_time} dk
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {item.matchedIngredients.slice(0, 3).map((name) => (
            <span key={name} className="bg-primary-fixed/50 text-on-primary-fixed text-xs px-2 py-0.5 rounded-full font-medium">
              {name}
            </span>
          ))}
          {item.missingIngredients.length > 0 && (
            <span className="bg-secondary-fixed/50 text-on-secondary-fixed text-xs px-2 py-0.5 rounded-full font-medium">
              +{item.missingIngredients.length} eksik
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-auto">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">favorite</span>{item.favoriteCount}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">bookmark</span>{item.saveCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
