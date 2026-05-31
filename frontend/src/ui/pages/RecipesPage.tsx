import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

type Recipe = { id: number; title: string; description: string; favorite_count: number; save_count: number };

export default function RecipesPage() {
  const [items, setItems] = useState<Recipe[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    api<{ items: Recipe[] }>("GET", "/recipes").then((d) => setItems(d.items)).catch((e) => setErr(e.message));
  }, []);

  const filtered = items.filter((r) => (q ? r.title.toLowerCase().includes(q.toLowerCase()) : true));

  return (
    <div>
      <h2>Tarifler</h2>
      <div className="muted">Listeyi tara ve detaydan favori/kaydet.</div>
      {err && <div className="error" style={{ marginTop: 12 }}>{err}</div>}
      <div className="card" style={{ marginTop: 12 }}>
        <div className="field" style={{ marginTop: 0 }}>
          <label className="muted">Ara</label>
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tarif adı..." />
        </div>
      </div>
      <div className="grid">
        {filtered.map((r) => (
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
