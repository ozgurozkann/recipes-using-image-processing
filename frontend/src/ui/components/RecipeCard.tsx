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
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Kolay",
  medium: "Orta",
  hard: "Zor",
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "ok",
  medium: "warning",
  hard: "danger",
};

const EMOJI_MAP: Record<string, string> = {
  "Kahvaltı": "🍳", "Ana yemek": "🍽️", "Çorba": "🥣",
  "Meze": "🫙", "Salata": "🥗", "Tatlı": "🍮", "Sos": "🫕",
};

function randomEmoji(id: number): string {
  const emojis = ["🍜", "🍲", "🥘", "🫕", "🥗", "🍳", "🥙", "🥗", "🍱"];
  return emojis[id % emojis.length];
}

interface Props {
  recipe: RecipeCardData;
  rank?: number;
  matchScore?: number;
  matchedIngredients?: string[];
  missingIngredients?: string[];
  style?: React.CSSProperties;
  onRefresh?: () => void;
}

export default function RecipeCard({ recipe: r, rank, matchScore, matchedIngredients, missingIngredients, style, onRefresh }: Props) {
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
      const res = await api<{ saved: boolean }>("POST", `/recipes/${r.id}/save`);
      toast(res.saved ? "Kaydedildi" : "Kayıt kaldırıldı");
      onRefresh?.();
    } catch (err: any) { toastError("Hata", err.message); }
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", ...style }}>
      {/* Image placeholder */}
      <div className="recipe-img">
        <span style={{ fontSize: 40, animation: "float 4s ease-in-out infinite", animationDelay: `${r.id * 0.3}s` }}>
          {randomEmoji(r.id)}
        </span>
        {rank !== undefined && (
          <span className={`rank-badge rank-${rank <= 3 ? rank : ""}`}
            style={{ position: "absolute", top: 10, left: 10, ...(rank > 3 ? { background: "var(--panel)", border: "1px solid var(--border)", color: "var(--muted)" } : {}) }}>
            {rank}
          </span>
        )}
        {matchScore !== undefined && (
          <span className="badge primary" style={{ position: "absolute", top: 10, right: 10 }}>
            {matchScore}%
          </span>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <Link to={`/recipes/${r.id}`} style={{ textDecoration: "none" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, lineHeight: 1.3, color: "var(--text)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary-light)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text)")}
          >
            {r.title}
          </h3>
        </Link>

        {r.description && (
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {r.description}
          </p>
        )}

        <div className="recipe-meta">
          {r.difficulty && (
            <span className={`badge ${DIFFICULTY_COLOR[r.difficulty] || ""}`}>
              {DIFFICULTY_LABEL[r.difficulty] || r.difficulty}
            </span>
          )}
          {r.cooking_time ? <span className="badge">⏱ {r.cooking_time}dk</span> : null}
          {r.serving_count ? <span className="badge">👥 {r.serving_count}</span> : null}
        </div>

        {/* Recommendation pills */}
        {matchedIngredients && matchedIngredients.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Eşleşen</div>
            <div>{matchedIngredients.slice(0, 4).map((n) => <span key={n} className="pill ok">{n}</span>)}</div>
          </div>
        )}
        {missingIngredients && missingIngredients.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>Eksik</div>
            <div>{missingIngredients.slice(0, 3).map((n) => <span key={n} className="pill danger">{n}</span>)}
              {missingIngredients.length > 3 && <span className="pill">+{missingIngredients.length - 3}</span>}
            </div>
          </div>
        )}

        {/* Score bar */}
        {matchScore !== undefined && (
          <div className="score-bar-wrap">
            <div className="score-bar-label">
              <span>Eşleşme</span>
              <span style={{ color: matchScore >= 70 ? "var(--ok)" : matchScore >= 40 ? "var(--warning)" : "var(--danger)" }}>
                {matchScore}%
              </span>
            </div>
            <div className="score-bar-track">
              <div className="score-bar-fill" style={{ width: `${matchScore}%` } as any} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: 12, fontSize: 13, color: "var(--muted)" }}>
          <span>♡ {r.favorite_count}</span>
          <span>⬇ {r.save_count}</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn btn-sm ghost" onClick={handleFavorite} title="Favorile">♡</button>
          <button className="btn btn-sm ghost" onClick={handleSave} title="Kaydet">⬇</button>
          <Link to={`/recipes/${r.id}`} className="btn btn-sm primary">Gör →</Link>
        </div>
      </div>
    </div>
  );
}
