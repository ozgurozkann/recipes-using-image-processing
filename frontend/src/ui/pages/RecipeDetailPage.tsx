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
  ingredients: RecipeIngredient[];
};

const DIFFICULTY_LABEL: Record<string, string> = { easy: "Kolay", medium: "Orta", hard: "Zor" };
const DIFFICULTY_COLOR: Record<string, string> = { easy: "var(--ok)", medium: "var(--warning)", hard: "var(--danger)" };

function randomEmoji(id: number): string {
  return ["🍜", "🍲", "🥘", "🫕", "🥗", "🍳", "🥙", "🍱"][id % 8];
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
      .then((r) => { setItem(r); })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  async function toggleFavorite() {
    if (!token) { toastError("Giriş gerekli", "Favorilere eklemek için giriş yapın."); return; }
    try {
      const res = await api<{ favorited: boolean }>("POST", `/recipes/${id}/favorite`);
      setFavorited(res.favorited);
      toast(res.favorited ? "Favorilere eklendi ♡" : "Favorilerden çıkarıldı");
      load();
    } catch (e: any) { toastError("Hata", e.message); }
  }

  async function toggleSave() {
    if (!token) { toastError("Giriş gerekli", "Kaydetmek için giriş yapın."); return; }
    try {
      const res = await api<{ saved: boolean }>("POST", `/recipes/${id}/save`);
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

  const steps = item.instructions.split("\n").filter(Boolean);

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
        <div style={{
          height: 240, background: "linear-gradient(135deg, var(--primary-subtle) 0%, var(--ok-subtle) 100%)",
          display: "flex", alignItems: "center", justifyContent: "center", position: "relative"
        }}>
          {item.image_url ? (
            <img src={item.image_url} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: 80, animation: "heroFloat 5s ease-in-out infinite" }}>{randomEmoji(item.id)}</span>
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(7,11,19,0.8) 0%, transparent 60%)" }} />
          <div style={{ position: "absolute", bottom: 20, left: 24, right: 24 }}>
            <h1 style={{ fontSize: "clamp(22px,4vw,32px)", fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>{item.title}</h1>
          </div>
        </div>

        {/* Meta */}
        <div style={{ padding: "20px 24px" }}>
          {item.description && (
            <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.7, marginBottom: 18 }}>{item.description}</p>
          )}

          {/* Stats row */}
          <div className="kpi-row">
            {item.cooking_time > 0 && <div className="kpi">⏱ {item.cooking_time} dk</div>}
            {item.serving_count > 0 && <div className="kpi">👥 {item.serving_count} kişi</div>}
            <div className="kpi" style={{ color: DIFFICULTY_COLOR[item.difficulty] }}>
              {DIFFICULTY_LABEL[item.difficulty] || item.difficulty}
            </div>
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
              {saved ? "✓ Kaydedildi" : "⬇ Kaydet"}
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
