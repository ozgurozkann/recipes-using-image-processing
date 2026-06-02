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

      {loading ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <div className="empty card">
          <div className="empty-icon" style={{ animation: "float 3s ease-in-out infinite" }}>📋</div>
          <div className="empty-title">Henüz kaydedilmiş tarif yok</div>
          <div className="empty-sub">Tarifleri keşfedip kaydet, istediğin zaman bul!</div>
          <Link to="/recipes" className="btn primary" style={{ marginTop: 16 }}>Tariflere Gözat</Link>
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
