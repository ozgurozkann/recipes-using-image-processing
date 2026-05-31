import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import RecipeCard, { RecipeCardData } from "../components/RecipeCard";
import { PageLoader } from "../components/Spinner";

const DIFFICULTY_OPTIONS = [
  { value: "", label: "Tüm Zorluklar" },
  { value: "easy", label: "Kolay" },
  { value: "medium", label: "Orta" },
  { value: "hard", label: "Zor" },
];

export default function RecipesPage() {
  const [items, setItems] = useState<RecipeCardData[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [difficulty, setDifficulty] = useState("");

  function load() {
    setLoading(true);
    api<{ items: RecipeCardData[] }>("GET", "/recipes")
      .then((d) => setItems(d.items))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() =>
    items.filter((r) => {
      const matchQ = !q || r.title.toLowerCase().includes(q.toLowerCase()) || (r.description || "").toLowerCase().includes(q.toLowerCase());
      const matchD = !difficulty || r.difficulty === difficulty;
      return matchQ && matchD;
    }),
    [items, q, difficulty]
  );

  return (
    <div>
      <div className="page-hero">
        <h1 className="page-title">Tüm <span>Tarifler</span></h1>
        <p className="page-sub">Keşfet, favoriyle, pişir.</p>
      </div>

      {/* Filters */}
      <div className="card card-flat" style={{ padding: "14px 18px", marginBottom: 4 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 240px" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none" }}>🔍</span>
            <input className="input" placeholder="Tarif ara…" value={q} onChange={(e) => setQ(e.target.value)}
              style={{ paddingLeft: 38 }} />
          </div>
          <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
            style={{ flex: "0 1 160px" }}>
            {DIFFICULTY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="badge" style={{ whiteSpace: "nowrap" }}>
            {filtered.length} tarif
          </div>
        </div>
      </div>

      {err && <div className="error" style={{ marginTop: 12 }}>{err}</div>}

      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <div className="empty card" style={{ marginTop: 16 }}>
          <div className="empty-icon">🍽️</div>
          <div className="empty-title">Tarif bulunamadı</div>
          <div className="empty-sub">Farklı bir arama deneyin.</div>
        </div>
      ) : (
        <div className="grid stagger" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", margin: "16px 0 0" }}>
          {filtered.map((r) => (
            <RecipeCard key={r.id} recipe={r} onRefresh={load} />
          ))}
        </div>
      )}
    </div>
  );
}
