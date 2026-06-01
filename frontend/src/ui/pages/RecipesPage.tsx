import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import RecipeCard, { RecipeCardData } from "../components/RecipeCard";
import { PageLoader } from "../components/Spinner";

const PAGE_SIZE = 12;

const DIFFICULTY_OPTIONS = [
  { value: "", label: "Tüm Zorluklar" },
  { value: "easy", label: "Kolay" },
  { value: "medium", label: "Orta" },
  { value: "hard", label: "Zor" },
];

export default function RecipesPage() {
  const [items, setItems] = useState<RecipeCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [q, setQ] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const skipRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function fetchPage(skip: number, append: boolean) {
    const params = new URLSearchParams({ skip: String(skip), limit: String(PAGE_SIZE) });
    if (q) params.set("q", q);
    if (difficulty) params.set("difficulty", difficulty);

    const setter = append ? setLoadingMore : setLoading;
    setter(true);

    api<{ items: RecipeCardData[]; total: number; has_more: boolean }>(
      "GET",
      `/recipes?${params}`
    )
      .then((d) => {
        setItems((prev) => (append ? [...prev, ...d.items] : d.items));
        setTotal(d.total);
        setHasMore(d.has_more);
        skipRef.current = skip + d.items.length;
      })
      .catch((e) => setErr(e.message))
      .finally(() => setter(false));
  }

  // İlk yükleme & filtre değişiminde sıfırdan başla
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      skipRef.current = 0;
      fetchPage(0, false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, difficulty]); // eslint-disable-line react-hooks/exhaustive-deps

  function loadMore() {
    fetchPage(skipRef.current, true);
  }

  function reload() {
    skipRef.current = 0;
    fetchPage(0, false);
  }

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
            <input
              className="input"
              placeholder="Tarif ara…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ paddingLeft: 38 }}
            />
          </div>
          <select
            className="input"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            style={{ flex: "0 1 160px" }}
          >
            {DIFFICULTY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="badge" style={{ whiteSpace: "nowrap" }}>
            {total} tarif
          </div>
        </div>
      </div>

      {err && <div className="error" style={{ marginTop: 12 }}>{err}</div>}

      {loading ? (
        <PageLoader />
      ) : items.length === 0 ? (
        <div className="empty card" style={{ marginTop: 16 }}>
          <div className="empty-icon">🍽️</div>
          <div className="empty-title">Tarif bulunamadı</div>
          <div className="empty-sub">Farklı bir arama deneyin.</div>
        </div>
      ) : (
        <>
          <div className="grid stagger" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", margin: "16px 0 0" }}>
            {items.map((r) => (
              <RecipeCard key={r.id} recipe={r} onRefresh={reload} />
            ))}
          </div>

          {hasMore && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 24, marginBottom: 8 }}>
              <button
                className="btn btn-secondary"
                onClick={loadMore}
                disabled={loadingMore}
                style={{ minWidth: 180 }}
              >
                {loadingMore ? "Yükleniyor…" : "Daha Fazla Göster"}
              </button>
            </div>
          )}

          {!hasMore && items.length > 0 && (
            <p style={{ textAlign: "center", color: "var(--text-muted)", marginTop: 24, fontSize: 14 }}>
              Tüm {total} tarif gösterildi.
            </p>
          )}
        </>
      )}
    </div>
  );
}
