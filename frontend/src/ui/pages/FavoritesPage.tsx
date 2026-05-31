import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

type Recipe = { id: number; title: string; favorite_count: number; save_count: number };

export default function FavoritesPage() {
  const [items, setItems] = useState<Recipe[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api<{ items: Recipe[] }>("GET", "/users/me/favorites").then((d) => setItems(d.items)).catch((e) => setErr(e.message));
  }, []);

  return (
    <div className="card">
      <h2>Favorilerim</h2>
      {err && <div className="error" style={{ marginTop: 12 }}>{err}</div>}
      {items.length === 0 ? (
        <div className="muted">Henüz favorin yok.</div>
      ) : (
        <ul>
          {items.map((r) => (
            <li key={r.id} style={{ marginTop: 8 }}>
              <Link to={`/recipes/${r.id}`}>{r.title}</Link> <span className="muted">(fav: {r.favorite_count}, save: {r.save_count})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
