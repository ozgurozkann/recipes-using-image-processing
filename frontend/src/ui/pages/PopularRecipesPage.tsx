import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

type Recipe = { id: number; title: string; description: string; favorite_count: number; save_count: number };

export default function PopularRecipesPage() {
  const [items, setItems] = useState<Recipe[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api<{ items: Recipe[] }>("GET", "/recipes/popular")
      .then((d) => setItems(d.items))
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <div>
      <h2>En Popüler Tarifler</h2>
      <div className="muted">Favori ve kaydetme sayısına göre.</div>
      {err && <div className="error" style={{ marginTop: 12 }}>{err}</div>}
      <div className="grid">
        {items.map((r) => (
          <div key={r.id} className="card" style={{ gridColumn: "span 4" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <strong>
                <Link to={`/recipes/${r.id}`}>{r.title}</Link>
              </strong>
              <span className="badge">#{r.id}</span>
            </div>
            <div className="muted" style={{ marginTop: 8 }}>
              {r.description || "—"}
            </div>
            <div className="kpiRow">
              <div className="kpi">Favori: {r.favorite_count}</div>
              <div className="kpi">Kaydetme: {r.save_count}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

