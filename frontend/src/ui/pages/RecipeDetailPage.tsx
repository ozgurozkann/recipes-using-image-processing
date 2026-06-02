import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import { PageLoader } from "../components/Spinner";
import { ConfirmModal } from "../components/Modal";
import { toast, toastError } from "../components/Toast";
import { getToken } from "../authStore";

type RecipeIngredient = {
  ingredient_id: number;
  name: string;
  quantity: number;
  unit: string;
};

type Recipe = {
  id: number; title: string; description: string; instructions: string;
  cooking_time: number; serving_count: number; difficulty: string;
  category_id: number | null; image_url: string;
  favorite_count: number; save_count: number; is_approved: boolean;
  is_favorited?: boolean; is_saved?: boolean;
  ingredients: RecipeIngredient[];
};

const DIFFICULTY_LABEL: Record<string, string> = { easy: "Kolay", medium: "Orta", hard: "Zor" };

function splitSteps(text: string): string[] {
  if (!text?.trim()) return [];

  // Önce satır sonlarına göre böl
  const byLine = text.split(/\n+/).map((s) => s.trim()).filter((s) => s.length > 4);
  if (byLine.length > 1) return byLine;

  // Tek satırsa cümlelere böl: ". " + büyük harf veya rakam veya Türkçe büyük
  const steps = text
    .split(/\.(?:\s+)(?=[A-ZÇĞİÖŞÜA-Z0-9])/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 6)
    .map((s) => (s.endsWith(".") || s.endsWith("!") ? s : s + "."));

  return steps.length > 1 ? steps : [text.trim()];
}


const FOOD_PHOTOS = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1484723091739-30f299680de?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1527515637347-bd4c1b3b1c7d?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1432139509613-5c4255815697?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1551024709-8f23befc548f?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=1200&h=500&fit=crop",
  "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=1200&h=500&fit=crop",
];

function getPhotoUrl(id: number, image_url?: string): string {
  if (image_url) return image_url;
  return FOOD_PHOTOS[id % FOOD_PHOTOS.length];
}

export default function RecipeDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<Recipe | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirmFav, setConfirmFav] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const token = getToken();

  function load() {
    setLoading(true);
    api<Recipe>("GET", `/recipes/${id}`)
      .then((r) => {
        setItem(r);
        setFavorited(Boolean(r.is_favorited));
        setSaved(Boolean(r.is_saved));
      })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  async function toggleFavorite() {
    if (!token) { toastError("Giriş gerekli", "Favorilere eklemek için giriş yapın."); return; }
    try {
      const res = await api<{ favorited: boolean }>(favorited ? "DELETE" : "POST", `/recipes/${id}/favorite`);
      setFavorited(res.favorited);
      toast(res.favorited ? "Favorilere eklendi ♡" : "Favorilerden çıkarıldı");
      load();
    } catch (e: any) { toastError("Hata", e.message); }
  }

  async function toggleSave() {
    if (!token) { toastError("Giriş gerekli", "Kaydetmek için giriş yapın."); return; }
    try {
      const res = await api<{ saved: boolean }>(saved ? "DELETE" : "POST", `/recipes/${id}/save`);
      setSaved(res.saved);
      toast(res.saved ? "Tarif kaydedildi ⬇" : "Kayıt kaldırıldı");
      load();
    } catch (e: any) { toastError("Hata", e.message); }
  }

  if (loading) return <PageLoader />;
  if (err) return (
    <div style={{ padding: "40px 0", textAlign: "center" }}>
      <div className="error" style={{ display: "inline-block" }}>⚠ {err}</div>
      <div style={{ marginTop: 16 }}><Link to="/recipes" className="btn">← Tariflere Dön</Link></div>
    </div>
  );
  if (!item) return null;

  const steps = splitSteps(item.instructions);

  return (
    <div style={{ animation: "fadeUp 0.4s ease both" }}>
      {/* Breadcrumb */}
      <div style={{ padding: "16px 0 0", fontSize: 13, color: "var(--muted)", display: "flex", alignItems: "center", gap: 8 }}>
        <Link to="/recipes" style={{ color: "var(--muted)" }}>Tarifler</Link>
        <span>›</span>
        <span style={{ color: "var(--text)" }}>{item.title}</span>
      </div>

      {/* Hero */}
      <div className="card" style={{ marginTop: 16, padding: 0, overflow: "hidden" }}>
        {/* Image */}
        <div style={{ height: 300, position: "relative", overflow: "hidden", background: "#111" }}>
          <img
            src={getPhotoUrl(item.id, item.image_url)}
            alt={item.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={(e) => { e.currentTarget.style.opacity = "0"; }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)" }} />
          <div style={{ position: "absolute", bottom: 24, left: 28, right: 28 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              {item.difficulty && (
                <span className={`photo-badge photo-badge-${item.difficulty}`}>
                  {DIFFICULTY_LABEL[item.difficulty] || item.difficulty}
                </span>
              )}
              {item.cooking_time > 0 && (
                <span className="photo-badge photo-badge-white">⏱ {item.cooking_time} dk</span>
              )}
              {item.serving_count > 0 && (
                <span className="photo-badge photo-badge-white">👥 {item.serving_count} kişi</span>
              )}
            </div>
            <h1 style={{ fontSize: "clamp(22px,4vw,34px)", fontWeight: 900, margin: 0, letterSpacing: "-0.5px", color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>{item.title}</h1>
          </div>
        </div>

        {/* Meta */}
        <div style={{ padding: "20px 24px" }}>
          {item.description && (
            <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.7, marginBottom: 18 }}>{item.description}</p>
          )}

          {/* Stats row */}
          <div className="kpi-row">
            <div className="kpi">♡ {item.favorite_count} favori</div>
            <div className="kpi">⬇ {item.save_count} kayıt</div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            <button
              className={`btn btn-lg ${favorited ? "danger" : "primary"}`}
              onClick={() => favorited ? setConfirmFav(true) : toggleFavorite()}
            >
              {favorited ? "♡ Favorilerden Çıkar" : "♡ Favorile"}
            </button>
            <button
              className={`btn btn-lg ${saved ? "ok" : ""}`}
              onClick={() => saved ? setConfirmSave(true) : toggleSave()}
            >
              {saved ? "✓ Kaydetmeyi Kaldır" : "⬇ Kaydet"}
            </button>
          </div>
        </div>
      </div>

      {/* Ingredients */}
      {item.ingredients && item.ingredients.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>🛒 Malzemeler</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
            {item.ingredients.map((ing, i) => (
              <div key={i} className="card card-sm" style={{
                display: "flex", alignItems: "center", gap: 10,
                animation: `fadeUp 0.3s ${i * 0.04}s ease both`, transform: "none"
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, var(--primary), var(--primary-dark))"
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, textTransform: "capitalize" }}>{ing.name}</span>
                  <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 6 }}>
                    {ing.quantity % 1 === 0 ? ing.quantity : ing.quantity.toFixed(2)} {ing.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Steps */}
      {steps.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>📝 Hazırlanış Adımları</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {steps.map((step, i) => (
              <div key={i} className="card card-sm" style={{ display: "flex", gap: 14, alignItems: "flex-start",
                animation: `fadeUp 0.35s ${i * 0.07}s ease both`, transform: "none" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: "#fff",
                  boxShadow: "0 4px 12px var(--primary-glow)"
                }}>
                  {i + 1}
                </div>
                <p style={{ margin: 0, lineHeight: 1.7, paddingTop: 5 }}>{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm modals */}
      <ConfirmModal
        isOpen={confirmFav} onClose={() => setConfirmFav(false)}
        onConfirm={toggleFavorite}
        title="Favorilerden Çıkar"
        message="Bu tarifi favorilerinden çıkarmak istediğinden emin misin?"
        confirmLabel="Çıkar" confirmClass="btn danger"
      />
      <ConfirmModal
        isOpen={confirmSave} onClose={() => setConfirmSave(false)}
        onConfirm={toggleSave}
        title="Kaydı Kaldır"
        message="Bu tarifin kaydını kaldırmak istiyor musun?"
        confirmLabel="Kaldır" confirmClass="btn danger"
      />
    </div>
  );
}
