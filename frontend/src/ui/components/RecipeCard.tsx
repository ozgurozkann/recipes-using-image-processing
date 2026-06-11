import { Link } from "react-router-dom";
import { api } from "../api";
import { getRecipePhoto } from "../recipePhotos";
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

interface Props {
  recipe: RecipeCardData;
  rank?: number;
  matchScore?: number;
  matchedIngredients?: string[];
  missingIngredients?: string[];
  style?: React.CSSProperties;
  onRefresh?: () => void;
  favoriteView?: boolean;
  savedView?: boolean;
}

export default function RecipeCard({
  recipe: r, rank, matchScore, matchedIngredients, missingIngredients, style, onRefresh, favoriteView = false, savedView = false,
}: Props) {
  async function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    try {
      const res = await api<{ favorited: boolean }>(favoriteView ? "DELETE" : "POST", `/recipes/${r.id}/favorite`);
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

  const photoUrl = getRecipePhoto(r, 480, 320);

  return (
    <div className="recipe-card" style={style}>
      <div className="recipe-card-image">
        <img src={photoUrl} alt={r.title} loading="lazy" />
        {rank !== undefined && (
          <span className={`absolute top-3 left-3 text-xs font-black px-2.5 py-1 rounded-full ${rank <= 3 ? "bg-primary text-white" : "bg-black/50 text-white"}`}>
            #{rank}
          </span>
        )}
        {matchScore !== undefined && (
          <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full bg-primary text-white">
            {matchScore}%
          </span>
        )}
        {r.difficulty && !matchScore && (
          <span className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/40 text-white backdrop-blur-sm">
            {DIFFICULTY_LABEL[r.difficulty] || r.difficulty}
          </span>
        )}
      </div>

      <div className="recipe-card-body">
        <Link to={`/recipes/${r.id}`}>
          <h3 className="font-semibold text-on-surface leading-snug mb-2 hover:text-primary transition-colors">{r.title}</h3>
        </Link>

        {(r.cooking_time || r.serving_count) && (
          <div className="flex items-center gap-3 text-xs text-on-surface-variant mb-2">
            {r.cooking_time ? <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">schedule</span>{r.cooking_time} dk</span> : null}
            {r.serving_count ? <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">group</span>{r.serving_count} kişi</span> : null}
          </div>
        )}

        {matchedIngredients && matchedIngredients.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {matchedIngredients.slice(0, 4).map((n) => (
              <span key={n} className="bg-primary-fixed/60 text-on-primary-fixed text-[10px] px-2 py-0.5 rounded-full font-medium">{n}</span>
            ))}
            {missingIngredients && missingIngredients.length > 0 && (
              <span className="bg-secondary-fixed/60 text-on-secondary-fixed text-[10px] px-2 py-0.5 rounded-full font-medium">
                +{missingIngredients.length} eksik
              </span>
            )}
          </div>
        )}

        {matchScore !== undefined && (
          <div className="mb-2">
            <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${matchScore}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-outline-variant/20">
          <span className="flex items-center gap-1 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-xs">favorite</span>{r.favorite_count}
          </span>
          <span className="flex items-center gap-1 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-xs">bookmark</span>{r.save_count}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
              onClick={handleFavorite}
              title={favoriteView ? "Favorilerden kaldır" : "Favorile"}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: favoriteView ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
            </button>
            <button
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
              onClick={handleSave}
              title={savedView ? "Kaydetmeyi kaldır" : "Kaydet"}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: savedView ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
            </button>
            <Link to={`/recipes/${r.id}`} className="text-xs font-semibold text-primary hover:underline ml-1">Gör</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
