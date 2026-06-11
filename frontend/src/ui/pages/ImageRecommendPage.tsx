import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Spinner from "../components/Spinner";
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
      toast(
        "Analiz tamamlandı",
        `${images.length} fotoğraf analiz edildi, ${out.items.length} tarif önerisi bulundu.`
      );
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
    <main className="photo-page">
      <nav className="photo-breadcrumbs" aria-label="Sayfa yolu">
        <Link to="/">ANA SAYFA</Link>
        <span className="material-symbols-outlined">chevron_right</span>
        <strong>FOTOĞRAF İLE ÖNERİ</strong>
      </nav>

      <section className="photo-hero">
        <div className="photo-title-row">
          <span className="material-symbols-outlined">photo_camera</span>
          <h1>Fotoğraf ile <em>Öneri</em></h1>
        </div>
        <p>Birden fazla malzeme fotoğrafı yükle, her biri ayrı analiz edilsin ve hepsini içeren tarifler gelsin.</p>
      </section>

      <section className="photo-workspace">
        <div className="photo-upload-column">
          <div
            className={`photo-drop-card${dragging ? " dragging" : ""}${images.length ? " has-images" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                e.currentTarget.value = "";
              }}
            />
            <div className="photo-scan-line" />
            <div className="photo-scanner-icon">
              <span className="material-symbols-outlined">center_focus_strong</span>
            </div>
            <h2>{images.length ? `${images.length} fotoğraf seçildi` : "AI Tarayıcıyı Başlat"}</h2>
            <p>{images.length ? `${totalSizeKb.toFixed(0)} KB · JPG, PNG, WEBP` : "Görselleri buraya sürükleyin veya tıklayın"}</p>
            <div className="photo-engine-pill">Neural Engine Active</div>
          </div>

          <button className="photo-analyze-btn" disabled={images.length === 0 || loading} onClick={submit}>
            {loading ? <><Spinner size="sm" /> Fotoğraflar analiz ediliyor</> : <><span className="material-symbols-outlined">auto_awesome</span>Yükle ve Analiz Et</>}
          </button>

          {detected.length > 0 && (
            <div className="photo-detected-card">
              <div className="photo-card-head"><span className="material-symbols-outlined">travel_explore</span><h3>Tespit Edilen Malzemeler</h3></div>
              <div className="photo-detected-list">
                {detected.map((d) => (
                  <div key={`${d.name}-${d.source ?? ""}`} className="photo-detected-row">
                    <div><strong>{d.name}</strong>{d.source && <span>{d.source}</span>}</div>
                    <div className="photo-confidence"><i style={{ width: `${Math.round(d.confidence * 100)}%` }} /><b>{Math.round(d.confidence * 100)}%</b></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="photo-preview-panel">
          {images.length === 0 && !loading && items.length === 0 && (
            <div className="photo-empty-state">
              <div className="photo-empty-icon"><span className="material-symbols-outlined">add_a_photo</span></div>
              <h3>Fotoğraf yükleyip analiz et</h3>
              <p>AI malzemeleri tespit edecek ve hepsini içeren tarifleri listeleyecek.</p>
              <div className="photo-placeholder-row">
                <span className="material-symbols-outlined">image</span>
                <span className="material-symbols-outlined">image</span>
                <span className="material-symbols-outlined dashed">add</span>
              </div>
            </div>
          )}

          {images.length > 0 && !loading && items.length === 0 && (
            <div className="photo-preview-state">
              <div className="photo-preview-grid">
                {images.map((image, index) => (
                  <figure key={imageKey(image.file)} className="photo-preview-tile">
                    <img src={image.preview} alt={image.file.name} />
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(index); }} aria-label="Fotoğrafı kaldır">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                    <figcaption>{image.file.name}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="photo-loading-state">
              <div className="photo-loading-ring"><span className="material-symbols-outlined">memory</span></div>
              <h3>Fotoğraflar tek tek analiz ediliyor</h3>
              <p>Malzemeler birleştiriliyor, tarifler eşleştiriliyor.</p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="photo-results">
              <div className="photo-results-head">
                <div>
                  <h2>{items.length} Tarif Önerisi</h2>
                  <p>Tespit edilen malzemelere göre eşleşen tarifler</p>
                </div>
                <span><span className="material-symbols-outlined">check_circle</span>Analiz tamamlandı</span>
              </div>
              <div className="photo-result-grid">
                {items.map((item) => <PhotoResultCard key={item.recipeId} item={item} />)}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="photo-info-card">
        <div className="photo-info-icon"><span className="material-symbols-outlined">query_stats</span></div>
        <div>
          <div className="photo-info-title"><h2>Gelişmiş Çoklu Analiz</h2><span>v2.0 Neural</span></div>
          <p>Her görsel bağımsız işlenir. Sistem farklı fotoğraflardan gelen malzemeleri birleştirir ve tarif eşleşmelerini buna göre çıkarır.</p>
        </div>
      </section>

      <section className="photo-feature-grid">
        <Feature icon="texture" title="Doku Tanıma" text="Malzemelerin görsel ipuçlarını ayrıştırarak daha isabetli öneriler üretir." />
        <Feature icon="science" title="Bileşen Ayrıştırma" text="Karmaşık yemek fotoğraflarını temel malzeme adaylarına ayırır." />
        <Feature icon="hub" title="Lezzet Matrisi" text="Bulunan malzemeler arasındaki uyuma göre tarifleri önceliklendirir." />
      </section>
    </main>
  );
}

function Feature({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <article className="photo-feature-card">
      <div><span className="material-symbols-outlined">{icon}</span></div>
      <h3>{title}</h3>
      <p>{text}</p>
      <footer><span>Processing</span><span className="material-symbols-outlined">arrow_forward</span></footer>
    </article>
  );
}

function PhotoResultCard({ item }: { item: RecItem }) {
  const recipe = {
    id: item.recipeId,
    title: item.title,
    image_url: item.image_url,
  };
  const photo = getRecipePhoto(recipe, 640, 460);
  return (
    <article className="photo-result-card">
      <Link to={`/recipes/${item.recipeId}`} className="photo-result-image">
        <img src={photo} alt={item.title} loading="lazy" />
        <span>{Math.round(item.matchScore)}% eşleşme</span>
      </Link>
      <div className="photo-result-body">
        <h3>{item.title}</h3>
        <div className="photo-result-meta">
          {item.cooking_time ? <span><span className="material-symbols-outlined">schedule</span>{item.cooking_time} dk</span> : null}
          {item.serving_count ? <span><span className="material-symbols-outlined">group</span>{item.serving_count} kişi</span> : null}
        </div>
        {!!item.matchedIngredients.length && (
          <div className="photo-pill-row">
            {item.matchedIngredients.slice(0, 4).map((name) => <span key={name}>{name}</span>)}
          </div>
        )}
        <div className="photo-result-footer">
          <span><span className="material-symbols-outlined">favorite</span>{item.favoriteCount}</span>
          <span><span className="material-symbols-outlined">bookmark</span>{item.saveCount}</span>
          <Link to={`/recipes/${item.recipeId}`}>Gör</Link>
        </div>
      </div>
    </article>
  );
}
