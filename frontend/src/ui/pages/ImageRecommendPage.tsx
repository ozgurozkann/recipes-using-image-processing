import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { toastError, toast } from "../components/Toast";
import { getRecipePhoto } from "../recipePhotos";

type SelectedImage = { file: File; preview: string };
type DetectedIng = { name: string; confidence: number; source?: string | null };
type RecItem = {
  id?: number;
  recipeId: number;
  title: string;
  description?: string;
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
type ImageRecommendResponse = {
  items: RecItem[];
  detectedIngredients: DetectedIng[];
};

function imageKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export default function ImageRecommendPage() {
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [detected, setDetected] = useState<DetectedIng[]>([]);
  const [items, setItems] = useState<RecItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<SelectedImage[]>([]);

  useEffect(() => {
    previewsRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((image) => URL.revokeObjectURL(image.preview));
    };
  }, []);

  function handleFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    if (incoming.length === 0) return;
    setImages((current) => {
      const known = new Set(current.map((image) => imageKey(image.file)));
      const additions = incoming
        .filter((file) => !known.has(imageKey(file)))
        .map((file) => ({ file, preview: URL.createObjectURL(file) }));
      return [...current, ...additions];
    });
    setItems([]);
    setDetected([]);
  }

  function removeImage(index: number) {
    setImages((current) => {
      const next = [...current];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.preview);
      return next;
    });
    setItems([]);
    setDetected([]);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  async function submit() {
    if (images.length === 0) return;
    setLoading(true);
    setDetected([]);
    setItems([]);
    try {
      const fd = new FormData();
      images.forEach((image) => fd.append("files", image.file));
      const out = await api<ImageRecommendResponse>("POST", "/recommendations/by-images", fd, true);
      toast("Analiz tamamlandı", `${images.length} fotoğraf analiz edildi, ${out.items.length} tarif önerisi bulundu.`);
      setDetected(out.detectedIngredients ?? []);
      setItems(out.items ?? []);
    } catch (e: any) {
      toastError("Hata", e.message);
    } finally {
      setLoading(false);
    }
  }

  const totalSizeKb = images.reduce((sum, image) => sum + image.file.size, 0) / 1024;

  return (
    <div className="pb-20">
      <main className="pt-8 pb-8 max-w-7xl mx-auto px-5 md:px-16">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-8 text-on-surface-variant/60 text-xs font-semibold uppercase tracking-wider">
          <Link to="/" className="hover:text-primary transition-colors">Ana Sayfa</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary font-bold">Fotoğraf ile Öneri</span>
        </nav>

        {/* Hero */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-secondary text-4xl">photo_camera</span>
            <h1 className="text-display-lg-mobile md:text-display-lg font-bold text-on-surface tracking-tight">
              Fotoğraf ile <span className="text-secondary">Öneri</span>
            </h1>
          </div>
          <p className="text-on-surface-variant text-body-lg max-w-2xl leading-relaxed">
            Birden fazla malzeme fotoğrafı yükle, her biri ayrı analiz edilsin ve hepsini içeren tarifler gelsin.
          </p>
        </section>

        {/* Upload + Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">

          {/* Upload Zone - left 5 cols */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div
              className={`glass-card rounded-[24px] p-12 flex flex-col items-center text-center cursor-pointer transition-all group relative overflow-hidden h-[340px] justify-center ${dragging ? "border-primary/40 bg-primary/5" : "hover:border-primary/20"}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
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
                <div className="w-24 h-24 mb-6 bg-primary-fixed/40 rounded-full flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                  <span className="material-symbols-outlined text-primary text-5xl" style={{ animation: "pulse 2s infinite" }}>
                    center_focus_strong
                  </span>
                </div>
                <h3 className="font-bold text-headline-md text-on-surface mb-2">
                  {images.length > 0 ? `${images.length} fotoğraf seçildi` : "AI Tarayıcıyı Başlat"}
                </h3>
                <p className="text-on-surface-variant text-body-md">
                  {images.length > 0 ? `${totalSizeKb.toFixed(0)} KB · JPG, PNG, WEBP` : "Görselleri buraya sürükleyin veya tıklayın"}
                </p>
                <div className="mt-4">
                  <span className="px-3 py-1 bg-surface-container-highest rounded-full text-[10px] font-bold tracking-widest uppercase opacity-60">
                    Neural Engine Active
                  </span>
                </div>
              </div>
            </div>

            {/* Analyze Button */}
            <button
              className="w-full bg-primary text-white py-5 rounded-[24px] font-bold text-body-lg flex items-center justify-center gap-3 hover:bg-primary-container transition-all ambient-shadow active:scale-[0.98] disabled:opacity-50"
              disabled={images.length === 0 || loading}
              onClick={submit}
            >
              {loading ? (
                <><span className="spinner" /> Fotoğraflar analiz ediliyor…</>
              ) : (
                <><span className="material-symbols-outlined">auto_awesome</span>Yükle ve Analiz Et</>
              )}
            </button>

            {/* Detected Ingredients */}
            {detected.length > 0 && (
              <div className="bg-white rounded-2xl border border-outline-variant p-5 ambient-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary">travel_explore</span>
                  <h3 className="font-bold text-sm">Tespit Edilen Malzemeler</h3>
                </div>
                <div className="space-y-3">
                  {detected.map((d) => (
                    <div key={`${d.name}-${d.source ?? ""}`} className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-sm text-on-surface">{d.name}</span>
                        {d.source && <span className="text-xs text-on-surface-variant ml-2">{d.source}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-outline-variant rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${Math.round(d.confidence * 100)}%` }} />
                        </div>
                        <span className="text-xs font-bold text-primary">{Math.round(d.confidence * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preview Zone - right 7 cols */}
          <div className="lg:col-span-7">
            <div className="bg-surface-container rounded-[24px] p-12 border border-outline-variant/30 flex flex-col items-center justify-center text-center min-h-[420px] relative overflow-hidden h-full">
              {/* Decorative blur blobs */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-10 right-10 w-32 h-32 bg-primary-fixed rounded-full blur-3xl" />
                <div className="absolute bottom-10 left-10 w-48 h-48 bg-secondary-fixed rounded-full blur-3xl" />
              </div>

              {/* Empty state */}
              {images.length === 0 && !loading && items.length === 0 && (
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 mb-6 bg-white/60 rounded-xl flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-on-surface-variant/40 text-4xl">add_a_photo</span>
                  </div>
                  <h3 className="font-bold text-headline-md text-on-surface mb-2">Fotoğraf yükleyip analiz et</h3>
                  <p className="text-on-surface-variant text-body-md max-w-sm">
                    AI malzemeleri tespit edecek ve hepsini içeren tarifleri listeleyecek.
                  </p>
                  <div className="mt-12 flex gap-4 opacity-50">
                    {[1, 2].map((i) => (
                      <div key={i} className="w-24 h-24 rounded-xl bg-surface-container-highest border border-outline-variant/50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant/20">image</span>
                      </div>
                    ))}
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-outline-variant/40 flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant/20">add</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Image preview grid */}
              {images.length > 0 && !loading && items.length === 0 && (
                <div className="relative z-10 w-full">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {images.map((image, index) => (
                      <figure key={imageKey(image.file)} className="relative rounded-xl overflow-hidden aspect-square">
                        <img src={image.preview} alt={image.file.name} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                          onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                        >
                          <span className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>close</span>
                        </button>
                        <figcaption className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-2 py-1 truncate">
                          {image.file.name}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading state */}
              {loading && (
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary" style={{ animation: "spin 1s linear infinite" }} />
                  <div className="text-center">
                    <h3 className="font-bold text-on-surface mb-1">Fotoğraflar analiz ediliyor</h3>
                    <p className="text-sm text-on-surface-variant">Malzemeler birleştiriliyor, tarifler eşleştiriliyor.</p>
                  </div>
                </div>
              )}

              {/* Results */}
              {!loading && items.length > 0 && (
                <div className="relative z-10 w-full">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-bold text-headline-md">{items.length} Tarif Önerisi</h2>
                      <p className="text-sm text-on-surface-variant">Tespit edilen malzemelere göre eşleşen tarifler</p>
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      Analiz tamamlandı
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    {items.map((item) => <PhotoResultCard key={item.recipeId} item={item} />)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Card */}
        <section className="mb-12">
          <div className="glass-card rounded-[24px] p-8 border border-primary/10 flex flex-col md:flex-row items-start md:items-center gap-8 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
            <div className="p-5 bg-primary text-white rounded-2xl flex-shrink-0 shadow-lg shadow-primary/20 relative z-10">
              <span className="material-symbols-outlined text-5xl">query_stats</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-bold text-headline-md text-primary">Gelişmiş Çoklu Analiz</h4>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-tighter">v2.0 Neural</span>
              </div>
              <p className="text-on-surface-variant text-body-md leading-relaxed max-w-3xl">
                Her görsel bağımsız işlenir. Sistem, farklı fotoğraflardan gelen malzemeleri birleştirir ve tarif eşleşmelerini buna göre çıkarır.
              </p>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: "texture", title: "Nöral Doku Tanıma", text: "Malzemelerin tazelik ve doku analizini yaparak en uygun pişirme tekniklerini önerir.", label: "Processing..." },
            { icon: "science", title: "Moleküler Dekompozisyon", text: "Karmaşık yemek fotoğraflarını temel bileşenlerine ayırarak gizli malzemeleri tespit eder.", label: "Analyzing..." },
            { icon: "hub", title: "Akıllı Lezzet Matrisi", text: "Malzemeler arasındaki kimyasal uyumu hesaplayarak beklenmedik lezzet kombinasyonları sunar.", label: "Optimizing..." },
          ].map((f) => (
            <div key={f.icon} className="glass-card rounded-[24px] p-8 flex flex-col gap-6 hover:-translate-y-2 transition-all duration-500 group cursor-pointer border-primary/5">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined">{f.icon}</span>
              </div>
              <div>
                <h5 className="font-bold text-lg mb-2">{f.title}</h5>
                <p className="text-on-surface-variant text-sm leading-relaxed">{f.text}</p>
              </div>
              <div className="mt-auto pt-4 border-t border-on-surface/5 flex justify-between items-center">
                <span className="text-[10px] font-bold opacity-40 uppercase">{f.label}</span>
                <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
              </div>
            </div>
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer className="culina-footer mt-8">
        <div className="culina-footer-inner">
          <span className="font-bold text-primary">Recipe AI</span>
          <p className="text-xs text-on-surface-variant opacity-50">© 2024 Recipe AI. The Discerning Visionary.</p>
        </div>
      </footer>
    </div>
  );
}

function PhotoResultCard({ item }: { item: RecItem }) {
  const photo = getRecipePhoto({ id: item.recipeId, title: item.title, image_url: item.image_url } as any, 640, 460);
  return (
    <article className="recipe-card">
      <Link to={`/recipes/${item.recipeId}`} className="recipe-card-image block">
        <img src={photo} alt={item.title} loading="lazy" />
        <span className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
          %{Math.round(item.matchScore)} eşleşme
        </span>
      </Link>
      <div className="recipe-card-body">
        <h3 className="font-semibold text-on-surface text-sm mb-2 leading-snug">{item.title}</h3>
        <div className="flex gap-2 text-xs text-on-surface-variant mb-2">
          {item.cooking_time ? <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">schedule</span>{item.cooking_time} dk</span> : null}
          {item.serving_count ? <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">group</span>{item.serving_count} kişi</span> : null}
        </div>
        {item.matchedIngredients.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {item.matchedIngredients.slice(0, 4).map((name) => (
              <span key={name} className="bg-primary-fixed/50 text-on-primary-fixed text-[10px] px-2 py-0.5 rounded-full font-medium">{name}</span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-auto">
          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">favorite</span>{item.favoriteCount}</span>
          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">bookmark</span>{item.saveCount}</span>
          <Link to={`/recipes/${item.recipeId}`} className="ml-auto text-primary font-semibold hover:underline">Gör</Link>
        </div>
      </div>
    </article>
  );
}
