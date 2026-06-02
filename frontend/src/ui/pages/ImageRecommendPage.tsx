import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import RecipeCard, { RecipeCardData } from "../components/RecipeCard";
import Spinner from "../components/Spinner";
import { toastError, toast } from "../components/Toast";

type SelectedImage = { file: File; preview: string };
type DetectedIng = { name: string; confidence: number; source?: string | null };
type RecItem = RecipeCardData & {
  recipeId: number;
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
      setItems(out.items.map((x) => ({
        ...x,
        id: x.recipeId,
        favorite_count: x.favoriteCount,
        save_count: x.saveCount,
      })));
    } catch (e: any) {
      toastError("Hata", e.message);
    } finally {
      setLoading(false);
    }
  }

  const totalSizeKb = images.reduce((sum, image) => sum + image.file.size, 0) / 1024;

  return (
    <div>
      <div className="page-hero">
        <h1 className="page-title">📸 Fotoğraf ile <span>Öneri</span></h1>
        <p className="page-sub">
          Birden fazla malzeme fotoğrafı yükle, her biri ayrı analiz edilsin ve hepsini içeren tarifler gelsin.
        </p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "minmax(320px, 400px) 1fr", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              className={`upload-zone${dragging ? " dragging" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              style={{ margin: 0, borderRadius: 0, border: "none", borderBottom: "1px dashed var(--border)" }}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files) handleFiles(e.target.files);
                  e.currentTarget.value = "";
                }}
              />
              <div className="upload-icon" style={{ animation: images.length ? "none" : "float 3s ease-in-out infinite" }}>
                {images.length ? "✅" : "📂"}
              </div>
              <div className="upload-title">
                {images.length ? `${images.length} fotoğraf seçildi` : "Dosyaları sürükle veya tıkla"}
              </div>
              <div className="upload-sub">
                {images.length
                  ? `${totalSizeKb.toFixed(0)} KB · JPG, PNG, WEBP`
                  : "Birden fazla JPG, PNG veya WEBP yükleyebilirsin"}
              </div>
            </div>

            {images.length > 0 && (
              <div style={{ padding: 16 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                    gap: 10,
                  }}
                >
                  {images.map((image, index) => (
                    <div key={imageKey(image.file)} style={{ position: "relative" }}>
                      <img
                        src={image.preview}
                        alt={image.file.name}
                        className="img-preview"
                        style={{ aspectRatio: "1 / 1", height: "auto", objectFit: "cover", margin: 0 }}
                      />
                      <button
                        type="button"
                        className="btn icon"
                        onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                        title="Fotoğrafı kaldır"
                        aria-label="Fotoğrafı kaldır"
                        style={{
                          position: "absolute",
                          right: 6,
                          top: 6,
                          width: 30,
                          height: 30,
                          background: "rgba(20,20,30,0.75)",
                          color: "white",
                          borderColor: "rgba(255,255,255,0.18)",
                        }}
                      >
                        ×
                      </button>
                      <div
                        title={image.file.name}
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--text)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {image.file.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            className="btn primary btn-lg"
            onClick={submit}
            disabled={images.length === 0 || loading}
            style={{ justifyContent: "center" }}
          >
            {loading ? <><Spinner size="sm" /> Fotoğraflar analiz ediliyor...</> : "🚀 Yükle ve Analiz Et"}
          </button>

          {detected.length > 0 && (
            <div className="card" style={{ animation: "scaleIn 0.3s ease both" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🔍 Tespit Edilen Malzemeler</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {detected.map((d) => (
                  <div key={`${d.name}-${d.source ?? ""}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</div>
                      {d.source && (
                        <div style={{ color: "var(--muted)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {d.source}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <div style={{ width: 80, height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${d.confidence * 100}%`,
                            background: "linear-gradient(90deg, var(--primary), var(--ok))",
                            borderRadius: 3,
                            animation: "scoreGrow 0.6s ease both",
                          }}
                        />
                      </div>
                      <span className="badge ok">{Math.round(d.confidence * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{ background: "var(--primary-subtle)", borderColor: "rgba(124,92,255,0.25)" }}>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
              <strong style={{ color: "var(--primary-light)" }}>ℹ Çoklu analiz</strong><br />
              Her fotoğraf modele ayrı gönderilir. Sonuçlarda, tespit edilen malzemelerin tamamını içeren tarifler listelenir.
            </div>
          </div>
        </div>

        <div>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 280, gap: 20 }}>
              <div style={{ position: "relative", width: 80, height: 80 }}>
                <div style={{ width: 80, height: 80, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--primary)", animation: "spin 0.8s linear infinite" }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                  🤖
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Fotoğraflar tek tek analiz ediliyor...</div>
                <div style={{ color: "var(--muted)", fontSize: 14 }}>Malzemeler birleştiriliyor, tarifler eşleştiriliyor</div>
              </div>
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="empty card">
              <div className="empty-icon" style={{ animation: "float 3s ease-in-out infinite" }}>📸</div>
              <div className="empty-title">Fotoğraf yükleyip analiz et</div>
              <div className="empty-sub">AI malzemeleri tespit edecek ve hepsini içeren tarifleri listeleyecek.</div>
            </div>
          )}

          {!loading && items.length > 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                    {items.length} Tarif Önerisi
                  </h2>
                  <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
                    Tespit edilen tüm malzemeleri içeren tarifler
                  </div>
                </div>
                <span className="badge ok" style={{ animation: "scaleIn 0.3s ease both" }}>Analiz tamamlandı ✓</span>
              </div>
              <div className="grid stagger" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", margin: 0 }}>
                {items.map((x) => (
                  <RecipeCard
                    key={x.recipeId}
                    recipe={{ ...x, id: x.recipeId, favorite_count: x.favoriteCount, save_count: x.saveCount }}
                    matchScore={x.matchScore}
                    matchedIngredients={x.matchedIngredients}
                    missingIngredients={x.missingIngredients}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
