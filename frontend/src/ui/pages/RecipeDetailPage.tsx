import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";

type Recipe = {
  id: number;
  title: string;
  description: string;
  instructions: string;
  favorite_count: number;
  save_count: number;
};

export default function RecipeDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<Recipe | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api<Recipe>("GET", `/recipes/${id}`).then(setItem).catch((e) => setErr(e.message));
  }, [id]);

  async function favorite() {
    await api("POST", `/recipes/${id}/favorite`);
    const r = await api<Recipe>("GET", `/recipes/${id}`);
    setItem(r);
  }
  async function unfavorite() {
    await api("DELETE", `/recipes/${id}/favorite`);
    const r = await api<Recipe>("GET", `/recipes/${id}`);
    setItem(r);
  }
  async function save() {
    await api("POST", `/recipes/${id}/save`);
    const r = await api<Recipe>("GET", `/recipes/${id}`);
    setItem(r);
  }
  async function unsave() {
    await api("DELETE", `/recipes/${id}/save`);
    const r = await api<Recipe>("GET", `/recipes/${id}`);
    setItem(r);
  }

  return (
    <div className="grid">
      <div className="card" style={{ gridColumn: "span 12" }}>
        {err && <div className="error">{err}</div>}
        {item && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0 }}>{item.title}</h2>
              <span className="badge">#{item.id}</span>
            </div>
            <div className="muted" style={{ marginTop: 8 }}>
              {item.description || "—"}
            </div>
            <div className="kpiRow">
              <div className="kpi">Favori: {item.favorite_count}</div>
              <div className="kpi">Kaydetme: {item.save_count}</div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              <button className="btn primary" onClick={favorite}>
                Favorile
              </button>
              <button className="btn" onClick={unfavorite}>
                Favoriden çıkar
              </button>
              <button className="btn primary" onClick={save}>
                Kaydet
              </button>
              <button className="btn" onClick={unsave}>
                Kaydı kaldır
              </button>
            </div>
            <h3 style={{ marginTop: 18 }}>Hazırlanış</h3>
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{item.instructions}</pre>
          </>
        )}
      </div>
    </div>
  );
}
