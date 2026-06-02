import { Link } from "react-router-dom";
import { api } from "../api";
import { toast, toastError } from "./Toast";

export type RecipeCardData = {
  id: number;
  title: string;
  description?: string;
  favorite_count: number;
  save_count: number;
  difficulty?: string;
  cooking_time?: number;
  serving_count?: number;
  category_id?: number | null;
  image_url?: string;
};

const DIFFICULTY_LABEL: Record<string, string> = { easy: "Kolay", medium: "Orta", hard: "Zor" };
const DIFFICULTY_CLASS: Record<string, string> = {
  easy: "photo-badge-easy",
  medium: "photo-badge-medium",
  hard: "photo-badge-hard",
};

// 20 curated Unsplash food photos — stable CDN URLs
const FOOD_PHOTOS = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=480&h=320&fit=crop",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=480&h=320&fit=crop",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=480&h=320&fit=crop",
  "https://images.unsplash.com/photo-1484723091739-30f299680de?w=480&h=320&fit=crop",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=480&h=320&fit=crop",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=480&h=320&fit=crop",
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=480&h=320&fit=crop",
  "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=480&h=320&fit=crop",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=480&h=320&fit=crop",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=480&h=320&fit=crop",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=480&h=320&fit=crop",
  "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=480&h=320&fit=crop",
  "https://images.unsplash.com/photo-1527515637347-bd4c1b3b1c7d?w=480&h=320&fit=crop",
  "https://images.unsplash.com/photo-1432139509613-5c4255815697?w=480&h=320&fit=crop",
  "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=480&h=320&fit=crop",
  "https://images.unsplash.com/photo-1551024709-8f23befc548f?w=480&h=320&fit=crop",
  "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=480&h=320&fit=crop",
  "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=480&h=320&fit=crop",
  "https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=480&h=320&fit=crop",
  "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=480&h=320&fit=crop",
];

function getPhoto(id: number, image_url?: string): string {
  if (image_url) return image_url;
  return FOOD_PHOTOS[id % FOOD_PHOTOS.length];
}

interface Props {
  recipe: RecipeCardData;
  rank?: number;
  matchScore?: number;
  matchedIngredients?: string[];
  missingIngredients?: string[];
  style?: React.CSSProperties;
  onRefresh?: () => void;
  savedView?: boolean;
}

export default function RecipeCard({
  recipe: r, rank, matchScore, matchedIngredients, missingIngredients, style, onRefresh, savedView = false,
}: Props) {
  async function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    try {
      const res = await api<{ favorited: boolean }>("POST", `/recipes/${r.id}/favorite`);
      toast(res.favorited ? "Favorilere eklendi" : "Favorilerden çıkarıldı");
      onRefresh?.();
    } catch (err: any) { toastError("Hata", err.message); }
  }

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    try {
      const res = await api<{ saved: boolean }>(savedView ? "DELETE" : "POST", `/recipes/${r.id}/save`);
      toast(res.saved ? "Kaydedildi" : "Kayıt kaldırıldı");
      onRefresh?.();
    } catch (err: any) { toastError("Hata", err.message); }
  }

  const photoUrl = getPhoto(r.id, r.image_url);

  return (
    <div className="recipe-card" style={style}>
      {/* Photo */}
      <div className="recipe-photo">
        <img
          src={photoUrl}
          alt={r.title}
          loading="lazy"
          onError={(e) => {
            // Fallback to gradient on image error
            e.currentTarget.style.display = "none";
            const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
            if (placeholder) placeholder.style.display = "flex";
          }}
        />
        <div className="recipe-photo-placeholder" style={{
          display: "none",
          background: `hsl(${(r.id * 47) % 360}, 60%, 35%)`,
          fontSize: 52,
        }}>
          🍽️
        </div>
        <div className="recipe-photo-overlay" />

        {/* Badges on photo */}
        <div className="recipe-photo-badges">
          <div style={{ display: "flex", gap: 5 }}>
            {rank !== undefined && (
              <span className={`rank-badge rank-${rank <= 3 ? rank : ""}`}
                style={rank > 3 ? { background: "rgba(0,0,0,0.5)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(6px)" } : {}}>
                {rank}
              </span>
            )}
            {r.difficulty && (
              <span className={`photo-badge ${DIFFICULTY_CLASS[r.difficulty] || "photo-badge-white"}`}>
                {DIFFICULTY_LABEL[r.difficulty] || r.difficulty}
              </span>
            )}
          </div>
          {matchScore !== undefined && (
            <span className="photo-badge photo-badge-match">{matchScore}%</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="recipe-body">
        <Link to={`/recipes/${r.id}`}>
          <h3 className="recipe-title">{r.title}</h3>
        </Link>

        <div className="recipe-meta">
          {r.cooking_time ? (
            <span className="badge">⏱ {r.cooking_time}dk</span>
          ) : null}
          {r.serving_count ? (
            <span className="badge">👥 {r.serving_count} kişi</span>
          ) : null}
        </div>

        {/* Recommendation pills */}
        {matchedIngredients && matchedIngredients.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>Eşleşen</div>
            <div>{matchedIngredients.slice(0, 4).map((n) => <span key={n} className="pill ok">{n}</span>)}</div>
          </div>
        )}
        {missingIngredients && missingIngredients.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 600 }}>Eksik</div>
            <div>
              {missingIngredients.slice(0, 3).map((n) => <span key={n} className="pill danger">{n}</span>)}
              {missingIngredients.length > 3 && <span className="pill">+{missingIngredients.length - 3}</span>}
            </div>
          </div>
        )}

        {matchScore !== undefined && (
          <div className="score-bar-wrap">
            <div className="score-bar-label">
              <span>Eşleşme</span>
              <span style={{ color: matchScore >= 70 ? "var(--ok)" : matchScore >= 40 ? "var(--warning)" : "var(--danger)" }}>
                {matchScore}%
              </span>
            </div>
            <div className="score-bar-track">
              <div className="score-bar-fill" style={{ width: `${matchScore}%` }} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="recipe-footer">
          <div style={{ display: "flex", gap: 10, fontSize: 12.5, color: "var(--muted)" }}>
            <span>♡ {r.favorite_count}</span>
            <span>⬇ {r.save_count}</span>
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            <button className="btn btn-sm ghost" onClick={handleFavorite} title="Favorile">♡</button>
            <button className="btn btn-sm ghost" onClick={handleSave} title={savedView ? "Kaydetmeyi kaldır" : "Kaydet"}>
              {savedView ? "×" : "⬇"}
            </button>
            <Link to={`/recipes/${r.id}`} className="btn btn-sm primary">Gör →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
