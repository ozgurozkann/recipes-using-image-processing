import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import RecipeCard, { RecipeCardData } from "../components/RecipeCard";
import { PageLoader } from "../components/Spinner";

export default function FavoritesPage() {
  const [items, setItems] = useState<RecipeCardData[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api<{ items: RecipeCardData[] }>("GET", "/users/me/favorites")
      .then((d) => setItems(d.items))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="page-hero">
        <h1 className="page-title">♡ <span>Favorilerim</span></h1>
        <p className="page-sub">Beğenip favorilediğin tarifler burada.</p>
      </div>

      {err && <div className="error">{err}</div>}

      {loading ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <div className="empty card">
          <div className="empty-icon" style={{ animation: "float 3s ease-in-out infinite" }}>♡</div>
          <div className="empty-title">Henüz favori tarif yok</div>
          <div className="empty-sub">Tarifleri keşfedip favorile!</div>
          <Link to="/recipes" className="btn primary" style={{ marginTop: 16 }}>Tariflere Gözat</Link>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span className="badge primary">{items.length} favori tarif</span>
          </div>
          <div className="grid stagger" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", marginTop: 8 }}>
            {items.map((r) => <RecipeCard key={r.id} recipe={r} onRefresh={load} favoriteView />)}
          </div>
        </>
      )}
    </div>
  );
}
