import { useRef, useState } from "react";
import { api } from "../api";
import RecipeCard, { RecipeCardData } from "../components/RecipeCard";
import Spinner from "../components/Spinner";
import { toastError, toast } from "../components/Toast";

type DetectedIng = { name: string; confidence: number };
type RecItem = RecipeCardData & {
  recipeId: number; matchScore: number;
  matchedIngredients: string[]; missingIngredients: string[];
  favoriteCount: number; saveCount: number;
};

export default function ImageRecommendPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [detected, setDetected] = useState<DetectedIng[]>([]);
  const [items, setItems] = useState<RecItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    setFile(f);
    setItems([]);
    setDetected([]);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  }

  async function submit() {
    if (!file) return;
    setLoading(true);
    setDetected([]);
    setItems([]);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const out = await api<{ items: RecItem[] }>("POST", "/recommendations/by-image", fd, true);
      toast("Analiz tamamlandı", `${out.items.length} tarif önerisi bulundu.`);
      setItems(out.items.map((x) => ({
        ...x, id: x.recipeId, favorite_count: x.favoriteCount, save_count: x.saveCount,
      })));
    } catch (e: any) {
      toastError("Hata", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-hero">
        <h1 className="page-title">📸 Fotoğraf ile <span>Öneri</span></h1>
        <p className="page-sub">Malzeme fotoğrafını yükle, AI tanısın ve sana uygun tarifleri getirsin.</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "400px 1fr", alignItems: "start" }}>
        {/* ── Left: Upload ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Upload zone */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              className={`upload-zone${dragging ? " dragging" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              style={{ margin: 0, borderRadius: 0, border: "none", borderBottom: "1px dashed var(--border)" }}
            >
              <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <div className="upload-icon" style={{ animation: file ? "none" : "float 3s ease-in-out infinite" }}>
                {file ? "✅" : "📂"}
              </div>
              <div className="upload-title">
                {file ? file.name : "Dosyayı sürükle veya tıkla"}
              </div>
              <div className="upload-sub">
                {file
                  ? `${(file.size / 1024).toFixed(0)} KB · JPG, PNG, WEBP`
                  : "JPG, PNG veya WEBP · Maks 10 MB"}
              </div>
            </div>

            {/* Preview */}
            {preview && (
              <div style={{ padding: "0 16px 16px" }}>
                <img src={preview} alt="Önizleme" className="img-preview" style={{ marginTop: 16 }} />
              </div>
            )}
          </div>

          {/* Action */}
          <button className="btn primary btn-lg" onClick={submit}
            disabled={!file || loading}
            style={{ justifyContent: "center" }}>
            {loading ? <><Spinner size="sm" /> Analiz ediliyor…</> : "🚀 Yükle ve Analiz Et"}
          </button>

          {/* Detected ingredients */}
          {detected.length > 0 && (
            <div className="card" style={{ animation: "scaleIn 0.3s ease both" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🔍 Tespit Edilen Malzemeler</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {detected.map((d) => (
                  <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 80, height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${d.confidence * 100}%`,
                          background: "linear-gradient(90deg, var(--primary), var(--ok))",
                          borderRadius: 3, animation: "scoreGrow 0.6s ease both" }} />
                      </div>
                      <span className="badge ok">{Math.round(d.confidence * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="card" style={{ background: "var(--primary-subtle)", borderColor: "rgba(124,92,255,0.25)" }}>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
              <strong style={{ color: "var(--primary-light)" }}>ℹ Şu an dummy mod</strong><br />
              Model .env'de <code style={{ background: "var(--panel2)", padding: "1px 6px", borderRadius: 4 }}>IMAGE_RECOGNITION_MODE=keras</code> yapılarak gerçek Keras modeli ile değiştirilebilir.
            </div>
          </div>
        </div>

        {/* ── Right: Results ── */}
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
                <div style={{ fontWeight: 700, marginBottom: 6 }}>AI Analiz Ediyor…</div>
                <div style={{ color: "var(--muted)", fontSize: 14 }}>Malzemeler tespit ediliyor, tarifler eşleştiriliyor</div>
              </div>
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="empty card">
              <div className="empty-icon" style={{ animation: "float 3s ease-in-out infinite" }}>📸</div>
              <div className="empty-title">Fotoğraf yükleyip analiz et</div>
              <div className="empty-sub">AI malzemeleri tespit edecek ve uygun tarifleri listeleyecek.</div>
            </div>
          )}

          {!loading && items.length > 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                  {items.length} Tarif Önerisi
                </h2>
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
