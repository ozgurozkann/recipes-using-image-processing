import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { toast, toastError } from "../components/Toast";
import { getRecipePhoto } from "../recipePhotos";
import { useLanguage } from "../i18n";

type Recipe = {
  id: number;
  title: string;
  description: string;
  cooking_time: number;
  serving_count: number;
  difficulty: string;
  image_url: string;
  is_approved: boolean;
  favorite_count: number;
  save_count: number;
};

export default function MyRecipesPage() {
  const { lang, t } = useLanguage();
  const diffLabel = (d: string) => ({ easy: t("diff_easy"), medium: t("diff_medium"), hard: t("diff_hard") }[d] ?? d);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api<{ items: Recipe[] }>("GET", "/recipes/mine")
      .then((r) => setRecipes(r.items))
      .catch((e) => toastError(lang === "tr" ? "Hata" : "Error", e.message))
      .finally(() => setLoading(false));
  }, []);

  async function deleteRecipe(id: number) {
    setDeletingId(id);
    try {
      await api("DELETE", `/recipes/${id}`);
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      toast(lang === "tr" ? "Silindi" : "Deleted", lang === "tr" ? "Tarif başarıyla silindi." : "Recipe deleted successfully.");
    } catch (e: any) {
      toastError(lang === "tr" ? "Hata" : "Error", e.message);
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

  if (loading) {
    return (
      <div className="page-loader">
        <span className="spinner spinner-primary" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  return (
    <div className="pb-20">
      <main className="pt-8 pb-8 max-w-7xl mx-auto px-5 md:px-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <nav className="flex items-center gap-2 mb-3 text-on-surface-variant/60 text-xs font-semibold uppercase tracking-wider">
              <Link to="/" className="hover:text-primary transition-colors">{t("my_home")}</Link>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-primary font-bold">{t("my_breadcrumb")}</span>
            </nav>
            <h1 className="text-display-lg-mobile md:text-display-lg font-bold text-on-surface tracking-tight">
              {t("my_h1")}
            </h1>
            <p className="text-on-surface-variant text-body-lg mt-1">
              {recipes.length} {lang === "tr" ? "tarif" : "recipes"} · {recipes.filter((r) => r.is_approved).length} {lang === "tr" ? "onaylı" : "approved"}
            </p>
          </div>
          <Link
            to="/recipes/add"
            className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-container transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            {t("my_add_btn")}
          </Link>
        </div>

        {/* Empty state */}
        {recipes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/5 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-primary/40 text-4xl">restaurant_menu</span>
            </div>
            <h2 className="font-bold text-headline-md text-on-surface mb-2">{t("my_empty_h2")}</h2>
            <p className="text-on-surface-variant text-sm mb-8 max-w-sm">
              {t("my_empty_desc")}
            </p>
            <Link
              to="/recipes/add"
              className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-container transition-all"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              {t("my_first_btn")}
            </Link>
          </div>
        )}

        {/* Recipe grid */}
        {recipes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recipes.map((recipe) => {
              const photo = getRecipePhoto(
                { id: recipe.id, title: recipe.title, image_url: recipe.image_url } as any,
                640, 420,
              );
              return (
                <article key={recipe.id} className="recipe-card relative">
                  <div className="recipe-card-image">
                    <img src={photo} alt={recipe.title} loading="lazy" />
                    <span
                      className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                        recipe.is_approved
                          ? "bg-green-600 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {recipe.is_approved ? "check_circle" : "pending"}
                      </span>
                      {recipe.is_approved ? t("my_approved") : t("my_pending")}
                    </span>
                  </div>

                  <div className="recipe-card-body">
                    <h3 className="font-semibold text-on-surface mb-1 leading-snug">{recipe.title}</h3>
                    <div className="flex gap-3 text-xs text-on-surface-variant mb-3">
                      {recipe.cooking_time > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">schedule</span>
                          {recipe.cooking_time} {t("unit_dk")}
                        </span>
                      )}
                      {recipe.serving_count > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">group</span>
                          {recipe.serving_count} {t("unit_kisi")}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">signal_cellular_alt</span>
                        {diffLabel(recipe.difficulty)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-auto pt-2 border-t border-outline-variant/20">
                      {recipe.is_approved && (
                        <Link
                          to={`/recipes/${recipe.id}`}
                          className="text-xs text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">open_in_new</span>
                          {t("my_view")}
                        </Link>
                      )}
                      <div className="flex gap-2 ml-auto">
                        <button
                          className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/8 hover:bg-primary/15 px-3 py-1.5 rounded-lg transition-colors"
                          onClick={() => navigate(`/recipes/edit/${recipe.id}`)}
                        >
                          <span className="material-symbols-outlined text-xs">edit</span>
                          {t("my_edit")}
                        </button>
                        <button
                          className="flex items-center gap-1 text-xs font-semibold text-error bg-error/8 hover:bg-error/15 px-3 py-1.5 rounded-lg transition-colors"
                          onClick={() => setConfirmId(recipe.id)}
                        >
                          <span className="material-symbols-outlined text-xs">delete</span>
                          {t("my_delete")}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Delete confirmation dialog */}
      {confirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setConfirmId(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mb-4 mx-auto">
              <span className="material-symbols-outlined text-error text-2xl">delete_forever</span>
            </div>
            <h3 className="font-bold text-on-surface text-center mb-2">{t("my_confirm_h3")}</h3>
            <p className="text-on-surface-variant text-sm text-center mb-6">
              {t("my_confirm_desc")}
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-semibold text-sm hover:bg-surface-container-low transition-colors"
                onClick={() => setConfirmId(null)}
              >
                {t("my_cancel")}
              </button>
              <button
                className="flex-1 py-2.5 rounded-xl bg-error text-white font-bold text-sm hover:bg-error/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                disabled={deletingId === confirmId}
                onClick={() => deleteRecipe(confirmId)}
              >
                {deletingId === confirmId ? <><span className="spinner" /> {t("my_deleting")}</> : t("my_confirm_btn")}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="culina-footer mt-8">
        <div className="culina-footer-inner">
          <span className="font-bold text-primary">Recipe AI</span>
          <p className="text-xs text-on-surface-variant opacity-50">© 2024 Recipe AI.</p>
        </div>
      </footer>
    </div>
  );
}
