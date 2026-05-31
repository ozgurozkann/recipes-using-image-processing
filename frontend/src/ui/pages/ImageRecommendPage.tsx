import { useState } from "react";
import { api } from "../api";

type RecItem = { recipeId: number; title: string; matchScore: number; matchedIngredients: string[]; missingIngredients: string[] };

export default function ImageRecommendPage() {
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<RecItem[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!file) return;
    setErr(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const out = await api<{ items: RecItem[] }>("POST", "/recommendations/by-image", fd, true);
      setItems(out.items);
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <div className="grid">
      <div className="card" style={{ gridColumn: "span 5" }}>
        <h2>Fotoğraf ile Öneri</h2>
        <div className="muted">Bir malzeme fotoğrafı yükle. (Şu an dummy detection)</div>
        {err && <div className="error" style={{ marginTop: 12 }}>{err}</div>}
        <div className="field">
          <label className="muted">Dosya</label>
          <input className="input" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <button className="btn primary" onClick={submit} style={{ marginTop: 12 }}>
          Yükle ve öner
        </button>
      </div>

      <div className="card" style={{ gridColumn: "span 7" }}>
        <h2>Öneriler</h2>
        <div className="muted">Skor, eşleşen ve eksikleri gösterir.</div>
        <div style={{ marginTop: 10 }}>
          {items.length === 0 ? (
            <div className="muted">Fotoğraf yükleyip “Yükle ve öner”e bas.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
              {items.map((x) => (
                <div key={x.recipeId} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: 12, background: "var(--panel2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <strong>{x.title}</strong>
                    <span className="badge">Skor {x.matchScore}</span>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div className="muted">Eşleşen</div>
                    <div>{(x.matchedIngredients || []).map((n) => <span key={n} className="pill">{n}</span>)}</div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div className="muted">Eksik</div>
                    <div>{(x.missingIngredients || []).map((n) => <span key={n} className="pill">{n}</span>)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
