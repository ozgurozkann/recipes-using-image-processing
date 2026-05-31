import { useEffect, useState } from "react";
import { api } from "../api";
import RecipeCard, { RecipeCardData } from "../components/RecipeCard";
import { PageLoader } from "../components/Spinner";

export default function PopularRecipesPage() {
  const [items, setItems] = useState<RecipeCardData[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api<{ items: RecipeCardData[] }>("GET", "/recipes/popular")
      .then((d) => setItems(d.items))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="page-hero">
        <h1 className="page-title">⭐ En <span>Popüler</span> Tarifler</h1>
        <p className="page-sub">Favori ve kaydetme sayısına göre sıralanmış en sevilen tarifler.</p>
      </div>

      {/* Top 3 podium */}
      {!loading && items.length >= 3 && (
        <div className="card" style={{ padding: "28px 24px", marginBottom: 8, animation: "fadeUp 0.4s ease both" }}>
          <div className="section-title">🏆 Podyum</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: 16, alignItems: "end" }}>
            {[items[1], items[0], items[2]].map((r, pos) => {
              const actualRank = pos === 0 ? 2 : pos === 1 ? 1 : 3;
              const heights = ["180px", "220px", "160px"];
              return (
                <div key={r.id} style={{ textAlign: "center", animation: `fadeUp 0.4s ${pos * 0.1}s ease both` }}>
                  <div style={{ height: heights[pos], background: "var(--panel2)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius) var(--radius) 0 0", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 32, position: "relative" }}>
                    <span className={`rank-badge rank-${actualRank}`} style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)" }}>
                      {actualRank}
                    </span>
                    {["🍜", "🍲", "🥘", "🫕", "🥗", "🍳", "🥙", "🍱"][r.id % 8]}
                  </div>
                  <div style={{ padding: "10px 6px 0", fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>♡ {r.favorite_count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {err && <div className="error">{err}</div>}

      {loading ? (
        <PageLoader />
      ) : (
        <div className="grid stagger" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", marginTop: 16 }}>
          {items.map((r, i) => (
            <RecipeCard key={r.id} recipe={r} rank={i + 1} onRefresh={load} />
          ))}
        </div>
      )}
    </div>
  );
}
