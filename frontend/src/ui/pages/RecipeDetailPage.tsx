import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import { toast, toastError } from "../components/Toast";
import { getToken } from "../authStore";
import { getRecipePhoto } from "../recipePhotos";

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

type Review = {
  id: number;
  user_id: number;
  user_name: string;
  user_avatar?: string | null;
  rating: number;
  comment: string;
  created_at: string;
  is_mine: boolean;
};

const DIFFICULTY_LABEL: Record<string, string> = { easy: "Kolay", medium: "Orta", hard: "Zor" };

function splitSteps(text: string): string[] {
  if (!text?.trim()) return [];
  const byLine = text.split(/\n+/).map((s) => s.trim()).filter((s) => s.length > 4);
  if (byLine.length > 1) return byLine;
  const steps = text
    .split(/\.(?:\s+)(?=[A-ZÇĞİÖŞÜA-Z0-9])/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 6)
    .map((s) => (s.endsWith(".") || s.endsWith("!") ? s : s + "."));
  return steps.length > 1 ? steps : [text.trim()];
}

export default function RecipeDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<Recipe | null>(null);
  const [cookingMode, setCookingMode] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [myRole, setMyRole] = useState("");
  const token = getToken();

  function load() {
    setLoading(true);
    api<Recipe>("GET", `/recipes/${id}`)
      .then((r) => { setItem(r); setFavorited(Boolean(r.is_favorited)); setSaved(Boolean(r.is_saved)); })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }

  function loadReviews() {
    api<{ items: Review[] }>("GET", `/recipes/${id}/reviews`).then((res) => {
      setReviews(res.items);
    }).catch(() => {});
  }

  useEffect(() => {
    load();
    loadReviews();
    if (token) {
      api<{ role: string }>("GET", "/auth/me").then((m) => setMyRole(m.role)).catch(() => {});
    }
  }, [id]);

  async function submitReview() {
    if (!myRating) return;
    setReviewLoading(true);
    try {
      await api("POST", `/recipes/${id}/reviews`, { rating: myRating, comment: commentText });
      setMyRating(0);
      setCommentText("");
      toast("Yorum eklendi");
      loadReviews();
    } catch (e: any) { toastError("Hata", e.message); }
    finally { setReviewLoading(false); }
  }

  async function deleteReview(reviewId: number) {
    setReviewLoading(true);
    try {
      await api("DELETE", `/recipes/${id}/reviews/${reviewId}`);
      toast("Yorum silindi");
      loadReviews();
    } catch (e: any) { toastError("Hata", e.message); }
    finally { setReviewLoading(false); }
  }

  async function toggleFavorite() {
    if (!token) { toastError("Giriş gerekli", "Favorilere eklemek için giriş yapın."); return; }
    try {
      const res = await api<{ favorited: boolean }>(favorited ? "DELETE" : "POST", `/recipes/${id}/favorite`);
      setFavorited(res.favorited);
      toast(res.favorited ? "Favorilere eklendi" : "Favorilerden çıkarıldı");
      load();
    } catch (e: any) { toastError("Hata", e.message); }
  }

  async function toggleSave() {
    if (!token) { toastError("Giriş gerekli", "Kaydetmek için giriş yapın."); return; }
    try {
      const res = await api<{ saved: boolean }>(saved ? "DELETE" : "POST", `/recipes/${id}/save`);
      setSaved(res.saved);
      toast(res.saved ? "Tarif kaydedildi" : "Kayıt kaldırıldı");
      load();
    } catch (e: any) { toastError("Hata", e.message); }
  }

  if (loading) return (
    <div className="page-loader">
      <div className="flex flex-col items-center gap-4">
        <span className="spinner spinner-primary" style={{ width: 36, height: 36 }} />
        <p className="text-on-surface-variant text-sm">Yükleniyor…</p>
      </div>
    </div>
  );

  if (err) return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 px-5">
      <div className="px-6 py-4 bg-error-container text-on-error-container rounded-2xl flex items-center gap-3">
        <span className="material-symbols-outlined">error</span> {err}
      </div>
      <Link to="/recipes" className="bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary-container transition-all">
        ← Tariflere Dön
      </Link>
    </div>
  );

  if (!item) return null;

  const steps = splitSteps(item.instructions);

  return (
    <>
    <div className="pb-16">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-5 md:px-16 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-6 text-on-surface-variant/60 text-xs font-semibold uppercase tracking-wider">
          <Link to="/recipes" className="hover:text-primary transition-colors">Tarifler</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary font-bold">{item.title}</span>
        </nav>

        {/* Hero Image */}
        <div className="relative overflow-hidden rounded-2xl h-[440px] ambient-shadow">
          <img
            src={getRecipePhoto(item, 1400, 600)}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = getRecipePhoto({ id: item.id + 1, title: "fallback" }, 1400, 600); }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {item.difficulty && (
                <span className="px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-white"
                  style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
                  {DIFFICULTY_LABEL[item.difficulty] || item.difficulty}
                </span>
              )}
              {item.cooking_time > 0 && (
                <span className="px-4 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1"
                  style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
                  <span className="material-symbols-outlined text-xs">timer</span>
                  {item.cooking_time} dk
                </span>
              )}
              {item.serving_count > 0 && (
                <span className="px-4 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1"
                  style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
                  <span className="material-symbols-outlined text-xs">group</span>
                  {item.serving_count} kişi
                </span>
              )}
            </div>

            <h1 className="text-display-lg-mobile md:text-display-lg font-bold text-white mb-4">{item.title}</h1>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={toggleFavorite}
                className={`flex items-center gap-2 px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shadow-lg ${
                  favorited ? "bg-secondary text-white" : "bg-secondary text-white"
                }`}
              >
                <span className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: favorited ? "'FILL' 1" : "'FILL' 0" }}>
                  favorite
                </span>
                {favorited ? "FAVORİLENDİ" : "FAVORİLE"}
              </button>
              <button
                onClick={toggleSave}
                className="flex items-center gap-2 px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", color: "white" }}
              >
                <span className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}>
                  bookmark
                </span>
                {saved ? "KAYDEDİLDİ" : "KAYDET"}
              </button>
              <button
                onClick={() => setCookingMode(true)}
                className="flex items-center gap-2 px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-primary text-white shadow-lg active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                  cooking
                </span>
                TARİFİ DENE
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-5 md:px-16 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Ingredients + Steps */}
        <div className="lg:col-span-8 space-y-6">
          {/* Description */}
          {item.description && (
            <div className="bg-white rounded-2xl p-6 ambient-shadow border border-black/5">
              <p className="text-on-surface-variant text-body-md leading-relaxed">{item.description}</p>
            </div>
          )}

          {/* Ingredients */}
          {item.ingredients && item.ingredients.length > 0 && (
            <div className="bg-white rounded-2xl p-6 ambient-shadow border border-black/5">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary text-2xl">shopping_basket</span>
                <h2 className="text-headline-md font-semibold text-on-surface">Malzemeler</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {item.ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center p-4 bg-surface-container-low rounded-xl border border-black/[0.03] hover:bg-white hover:shadow-sm transition-all">
                    <div className="w-3 h-3 rounded-full bg-secondary mr-4 flex-shrink-0" />
                    <div>
                      <span className="font-semibold text-on-surface text-sm capitalize">{ing.name}</span>
                      <span className="text-on-surface-variant text-xs ml-2">
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
            <div className="bg-white rounded-2xl p-6 ambient-shadow border border-black/5">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary text-2xl">restaurant_menu</span>
                <h2 className="text-headline-md font-semibold text-on-surface">Hazırlanışı</h2>
              </div>
              <div className="space-y-4">
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </span>
                    <p className="text-on-surface-variant text-body-md leading-relaxed pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: AI Analysis */}
        <aside className="lg:col-span-4 space-y-6">
          {/* AI Card */}
          <div className="bg-surface-container-high rounded-2xl p-6 ambient-shadow border border-black/5">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <h3 className="text-headline-md font-semibold text-on-surface">AI Analizi</h3>
            </div>
            <p className="text-on-surface-variant text-body-md mb-6 leading-relaxed">
              {item.description || "Bu tarif, taze malzemeler sayesinde zengin besin değeri içerir ve sağlıklı bir beslenme düzenine uygundur."}
            </p>
            <div className="space-y-3">
              {[
                { label: "Favori", value: item.favorite_count, icon: "favorite" },
                { label: "Kaydeden", value: item.save_count, icon: "bookmark" },
                ...(item.cooking_time ? [{ label: "Süre", value: `${item.cooking_time} dk`, icon: "timer" }] : []),
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                  <span className="text-xs font-semibold text-on-surface uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">{stat.icon}</span>
                    {stat.label}
                  </span>
                  <span className="font-bold text-primary">{stat.value}</span>
                </div>
              ))}
            </div>
            {item.difficulty && (
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="bg-secondary-fixed text-on-secondary-container px-3 py-1 rounded-full text-xs font-semibold">
                  {DIFFICULTY_LABEL[item.difficulty] || item.difficulty}
                </span>
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-2xl p-6 ambient-shadow border border-black/5">
            {/* Header + avg */}
            {(() => {
              const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
              return (
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <h3 className="font-semibold text-on-surface text-sm">Yorumlar</h3>
                  </div>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-primary">{avg.toFixed(1)}</span>
                      <span className="text-xs text-on-surface-variant">({reviews.length} yorum)</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Rating form */}
            {token ? (
              <div className="mb-5 p-4 bg-surface-container-low rounded-xl space-y-3">
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Değerlendirin</p>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="text-2xl transition-transform hover:scale-110 focus:outline-none"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setMyRating(star)}
                    >
                      <span className="material-symbols-outlined" style={{
                        fontVariationSettings: (hoverRating || myRating) >= star ? "'FILL' 1" : "'FILL' 0",
                        color: (hoverRating || myRating) >= star ? "#e8a000" : "#ccc",
                      }}>star</span>
                    </button>
                  ))}
                  {myRating > 0 && <span className="text-xs text-on-surface-variant self-center ml-1">{myRating}/5</span>}
                </div>
                <textarea
                  className="w-full border border-outline-variant rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  rows={3}
                  placeholder="Yorumunuzu yazın… (isteğe bağlı)"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={1000}
                />
                <div className="flex gap-2">
                  <button
                    onClick={submitReview}
                    disabled={!myRating || reviewLoading}
                    className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-bold disabled:opacity-40 hover:bg-primary/90 transition-colors"
                  >
                    {reviewLoading ? "Gönderiliyor…" : "Gönder"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant mb-4">
                Yorum yapmak için{" "}
                <Link to="/login" className="text-primary font-semibold hover:underline">giriş yapın</Link>.
              </p>
            )}

            {/* Review list */}
            {reviews.length === 0 ? (
              <p className="text-xs text-on-surface-variant text-center py-4">Henüz yorum yok. İlk yorumu siz yapın!</p>
            ) : (
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2" style={{ scrollbarWidth: "thin", scrollbarColor: "#154212 #f0f0f0" }}>
                {reviews.map((rv) => (
                  <div key={rv.id} className={`flex gap-3 ${rv.is_mine ? "bg-primary/5 rounded-xl p-3" : ""}`}>
                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-primary to-primary-fixed flex items-center justify-center overflow-hidden">
                      {rv.user_avatar
                        ? <img src={rv.user_avatar} alt="" className="w-full h-full object-cover" />
                        : <span className="text-white text-xs font-bold">{rv.user_name[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-xs font-semibold text-on-surface truncate">{rv.user_name}</span>
                        <div className="flex">
                          {[1,2,3,4,5].map((s) => (
                            <span key={s} className="material-symbols-outlined text-xs" style={{ fontVariationSettings: rv.rating >= s ? "'FILL' 1" : "'FILL' 0", color: rv.rating >= s ? "#e8a000" : "#ccc" }}>star</span>
                          ))}
                        </div>
                        {(rv.is_mine || myRole === "admin") && (
                          <button
                            onClick={() => deleteReview(rv.id)}
                            disabled={reviewLoading}
                            className="ml-auto text-[10px] text-error hover:underline disabled:opacity-40"
                          >
                            Sil
                          </button>
                        )}
                      </div>
                      {rv.comment && <p className="text-xs text-on-surface-variant leading-relaxed">{rv.comment}</p>}
                      <p className="text-[10px] text-on-surface-variant/50 mt-1">{new Date(rv.created_at).toLocaleDateString("tr-TR")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Back to list */}
          <Link
            to="/recipes"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary transition-all font-semibold text-sm"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Tüm Tariflere Dön
          </Link>
        </aside>
      </section>
    </div>

    {cookingMode && (
      <CookingModeModal
        recipe={item}
        steps={steps}
        onClose={() => setCookingMode(false)}
      />
    )}
    </>
  );
}

// ─── Cooking Mode Modal ───────────────────────────────────────────────────────

type CookingPhase = "ingredients" | "cooking" | "done";

function CookingModeModal({
  recipe,
  steps,
  onClose,
}: {
  recipe: Recipe;
  steps: string[];
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<CookingPhase>("ingredients");
  const [stepIndex, setStepIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (phase === "done") {
      countdownRef.current = setTimeout(() => onClose(), 5000);
    }
    return () => { if (countdownRef.current) clearTimeout(countdownRef.current); };
  }, [phase, onClose]);

  function startCooking() {
    if (steps.length === 0) { setPhase("done"); return; }
    setStepIndex(0);
    setAnimKey((k) => k + 1);
    setPhase("cooking");
  }

  function next() {
    if (stepIndex >= steps.length - 1) {
      setPhase("done");
    } else {
      setStepIndex((i) => i + 1);
      setAnimKey((k) => k + 1);
    }
  }

  function prev() {
    if (stepIndex === 0) {
      setPhase("ingredients");
    } else {
      setStepIndex((i) => i - 1);
      setAnimKey((k) => k + 1);
    }
  }

  const progress = steps.length > 0 ? ((stepIndex + 1) / steps.length) * 100 : 100;

  return (
    <>
      <style>{`
        @keyframes steam-rise {
          0%   { opacity: 0;   transform: translateY(0px)   scaleX(1);   }
          40%  { opacity: 0.7; transform: translateY(-12px) scaleX(1.3); }
          100% { opacity: 0;   transform: translateY(-28px) scaleX(0.7); }
        }
        @keyframes pot-rock {
          0%,100% { transform: rotate(-5deg) translateY(0px);  }
          50%     { transform: rotate(5deg)  translateY(-8px); }
        }
        @keyframes step-fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0px);  }
        }
        @keyframes confetti-pop {
          0%   { opacity: 0; transform: scale(0.5); }
          60%  { opacity: 1; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1);   }
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >

          {/* ── INGREDIENTS PHASE ─────────────────── */}
          {phase === "ingredients" && (
            <>
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>cooking</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-on-surface">Tarifi Dene</h2>
                    <p className="text-xs text-on-surface-variant truncate max-w-[200px]">{recipe.title}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full hover:bg-surface-container-low flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">close</span>
                </button>
              </div>

              <div className="px-6 py-5">
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_basket</span>
                  Gerekli Malzemeler · {recipe.ingredients.length} adet
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                  {recipe.ingredients.length === 0 && (
                    <p className="text-sm text-on-surface-variant py-4 text-center">Bu tarif için malzeme bilgisi yok.</p>
                  )}
                  {recipe.ingredients.map((ing, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                      <span className="font-medium text-sm text-on-surface capitalize flex-1">{ing.name}</span>
                      <span className="text-xs font-semibold text-primary bg-primary/8 px-2 py-0.5 rounded-lg">
                        {ing.quantity % 1 === 0 ? ing.quantity : ing.quantity.toFixed(2)} {ing.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 pb-6">
                <button
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-all shadow-lg shadow-primary/20"
                  onClick={startCooking}
                  disabled={steps.length === 0}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
                  {steps.length === 0 ? "Adım bilgisi yok" : "Hazırım, Başlayalım!"}
                </button>
              </div>
            </>
          )}

          {/* ── COOKING PHASE ─────────────────────── */}
          {phase === "cooking" && (
            <>
              {/* Header + progress */}
              <div className="px-6 pt-5 pb-4 border-b border-outline-variant/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Adım {stepIndex + 1} / {steps.length}
                  </span>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full hover:bg-surface-container-low flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-sm">close</span>
                  </button>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {/* Step dots — only when ≤ 10 steps */}
                {steps.length <= 10 && (
                  <div className="flex justify-between mt-2 px-0.5">
                    {steps.map((_, i) => (
                      <div
                        key={i}
                        className="rounded-full transition-all duration-300"
                        style={{
                          width: i === stepIndex ? 20 : 8,
                          height: 8,
                          background: i <= stepIndex ? "var(--md-sys-color-primary)" : "var(--md-sys-color-outline-variant)",
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Step content */}
              <div
                key={animKey}
                className="px-8 py-8 min-h-[180px] flex flex-col items-center justify-center text-center"
                style={{ animation: "step-fade-in 0.35s ease-out" }}
              >
                <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center font-extrabold text-2xl text-primary mb-5 shadow-md">
                  {stepIndex + 1}
                </div>
                <p className="text-on-surface text-base leading-relaxed font-medium max-w-sm">
                  {steps[stepIndex]}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 px-6 pb-6">
                <button
                  className="flex-1 py-3 rounded-xl border border-outline-variant text-on-surface-variant text-sm font-semibold hover:bg-surface-container-low transition-colors flex items-center justify-center gap-1"
                  onClick={prev}
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  {stepIndex === 0 ? "Malzemeler" : "Geri"}
                </button>
                <button
                  className="flex-[2] bg-primary text-white py-3 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-container transition-all shadow-lg shadow-primary/20"
                  onClick={next}
                >
                  {stepIndex === steps.length - 1 ? (
                    <>
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      Bitti!
                    </>
                  ) : (
                    <>
                      Yaptım
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* ── DONE PHASE ────────────────────────── */}
          {phase === "done" && (
            <div
              className="px-8 py-10 flex flex-col items-center text-center"
              style={{ animation: "confetti-pop 0.5s ease-out" }}
            >
              {/* Animated pot */}
              <div className="relative mb-2">
                {/* Steam wisps */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex gap-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: 6,
                        height: 28,
                        borderRadius: 99,
                        background: "rgba(100,100,100,0.18)",
                        animation: `steam-rise 1.6s ease-in-out ${i * 0.4}s infinite`,
                      }}
                    />
                  ))}
                </div>
                <div
                  className="text-8xl select-none"
                  style={{ animation: "pot-rock 1.2s ease-in-out infinite" }}
                >
                  🍲
                </div>
              </div>

              <h2 className="text-2xl font-extrabold text-on-surface mt-4 mb-1">Yemek Hazır! 🎉</h2>
              <p className="text-lg font-semibold text-primary mb-1">Afiyet Olsun!</p>
              <p className="text-sm text-on-surface-variant mb-8">
                {recipe.title} başarıyla tamamlandı.
              </p>

              <button
                className="bg-primary text-white px-10 py-3.5 rounded-xl font-bold hover:bg-primary-container transition-all shadow-lg shadow-primary/20"
                onClick={onClose}
              >
                Teşekkürler!
              </button>
              <p className="text-xs text-on-surface-variant/50 mt-3">5 saniye içinde kapanacak</p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
