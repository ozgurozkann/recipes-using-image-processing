import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import RecipeCard, { RecipeCardData } from "../components/RecipeCard";
import { PageLoader } from "../components/Spinner";

export default function SavedPage() {
  const [items, setItems] = useState<RecipeCardData[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api<{ items: RecipeCardData[] }>("GET", "/users/me/saved")
      .then((d) => setItems(d.items))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="page-hero">
        <h1 className="page-title">⬇ <span>Kaydettiklerim</span></h1>
        <p className="page-sub">Daha sonra pişirmek için kaydettiğin tarifler.</p>
      </div>

      {err && <div className="error">{err}</div>}

<<<<<<< Updated upstream
      {loading ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <div className="empty card">
          <div className="empty-icon" style={{ animation: "float 3s ease-in-out infinite" }}>📋</div>
          <div className="empty-title">Henüz kaydedilmiş tarif yok</div>
          <div className="empty-sub">Tarifleri keşfedip kaydet, istediğin zaman bul!</div>
          <Link to="/recipes" className="btn primary" style={{ marginTop: 16 }}>Tariflere Gözat</Link>
=======
        {loading ? (
          <div className="flex justify-center py-20">
            <span className="spinner spinner-primary" style={{ width: 36, height: 36 }} />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-20 bg-white rounded-2xl border border-outline-variant/30 ambient-shadow">
            <span className="material-symbols-outlined text-5xl text-outline">bookmark_border</span>
            <div className="text-center">
              <h3 className="font-bold text-on-surface mb-1">Henüz kaydedilmiş tarif yok</h3>
              <p className="text-on-surface-variant text-sm">Tarifleri keşfedip kaydet, istediğin zaman bul!</p>
            </div>
            <Link to="/recipes" className="bg-primary text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-primary-container transition-all">
              Tariflere Gözat
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <span className="px-3 py-1.5 bg-primary-fixed/50 text-primary text-xs font-bold rounded-full">{items.length} kaydedilmiş tarif</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {items.map((r) => <RecipeCard key={r.id} recipe={r} onRefresh={load} savedView hideActions />)}
            </div>
          </>
        )}
      </main>

      <footer className="culina-footer mt-12">
        <div className="culina-footer-inner">
          <span className="font-bold text-primary">Recipe AI</span>
          <p className="text-xs text-on-surface-variant opacity-50">© 2024 Recipe AI.</p>
>>>>>>> Stashed changes
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 4 }}>
            <span className="badge ok">{items.length} kaydedilmiş tarif</span>
          </div>
          <div className="grid stagger" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", marginTop: 8 }}>
            {items.map((r) => <RecipeCard key={r.id} recipe={r} onRefresh={load} savedView />)}
          </div>
        </>
      )}
    </div>
  );
}
