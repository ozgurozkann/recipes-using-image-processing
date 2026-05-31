import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import Spinner from "../components/Spinner";
import { toast, toastError } from "../components/Toast";

type Ingredient = { id: number; name: string; unit_type: string; category_id: number | null };
type Category = { id: number; name: string };

const STEPS = ["Temel Bilgiler", "Malzemeler", "Talimatlar"];

export default function AddRecipePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ingSearch, setIngSearch] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [cooking_time, setCookingTime] = useState(20);
  const [serving_count, setServingCount] = useState(2);
  const [difficulty, setDifficulty] = useState("easy");
  const [category_id, setCategoryId] = useState<number | null>(null);
  const [image_url, setImageUrl] = useState("");
  const [selected, setSelected] = useState<Record<number, { quantity: number; unit: string }>>({});

  useEffect(() => {
    Promise.all([
      api<{ items: Ingredient[] }>("GET", "/ingredients"),
      api<{ items: Category[] }>("GET", "/ingredients/categories"),
    ]).then(([a, b]) => { setIngredients(a.items); setCategories(b.items); }).catch(() => {});
  }, []);

  const filteredIngs = useMemo(() =>
    ingredients.filter((i) => !ingSearch || i.name.toLowerCase().includes(ingSearch.toLowerCase())),
    [ingredients, ingSearch]
  );

  const grouped = useMemo(() => {
    const map = new Map<number, Ingredient[]>();
    filteredIngs.forEach((i) => { const k = i.category_id || 0; map.set(k, [...(map.get(k) || []), i]); });
    return map;
  }, [filteredIngs]);

  function toggleIng(i: Ingredient) {
    setSelected((s) => { const n = { ...s }; if (n[i.id]) delete n[i.id]; else n[i.id] = { quantity: 1, unit: i.unit_type }; return n; });
  }

  async function submit() {
    if (!title.trim()) { toastError("Başlık gerekli", "Lütfen tarif adını girin."); return; }
    setLoading(true);
    try {
      const payload = {
        title: title.trim(), description, instructions, cooking_time, serving_count,
        difficulty, category_id, image_url,
        ingredients: Object.entries(selected).map(([id, v]) => ({ ingredient_id: Number(id), quantity: v.quantity, unit: v.unit })),
      };
      const r = await api<{ id: number }>("POST", "/recipes", payload);
      toast("Tarif eklendi!", "Admin değilsen onay bekleyebilir.");
      navigate(`/recipes/${r.id}`);
    } catch (e: any) {
      toastError("Hata", e.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedCount = Object.keys(selected).length;

  return (
    <div>
      <div className="page-hero">
        <h1 className="page-title">➕ Tarif <span>Ekle</span></h1>
        <p className="page-sub">Kendi tarifini topluluğa paylaş.</p>
      </div>

      {/* Step indicator */}
      <div className="steps" style={{ marginBottom: 24 }}>
        {STEPS.map((s, i) => (
          <div key={s} className="step" style={{ display: "flex", alignItems: "center" }}>
            <div className={`step${step === i ? " active" : ""}${step > i ? " done" : ""}`}
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: i < step ? "pointer" : "default" }}
              onClick={() => i < step && setStep(i)}>
              <div className="step-num">{step > i ? "✓" : i + 1}</div>
              <span className="step-label" style={{ display: "block" }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className="step-line" style={{ flex: 1, height: 2, margin: "0 10px", background: step > i ? "var(--ok)" : "var(--border)", borderRadius: 1 }} />}
          </div>
        ))}
      </div>

      {/* ── Step 0: Basic Info ── */}
      {step === 0 && (
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", animation: "fadeUp 0.3s ease both" }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Temel Bilgiler</h3>

            <div className="field" style={{ marginTop: 0 }}>
              <label className="label">Tarif Adı *</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: Tavuklu Sebze Sote" />
            </div>

            <div className="field">
              <label className="label">Açıklama</label>
              <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)}
                rows={3} placeholder="Tarif hakkında kısa bilgi…" />
            </div>

            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 0 }}>
              <div className="field" style={{ marginTop: 14 }}>
                <label className="label">Süre (dk)</label>
                <input className="input" type="number" min={1} value={cooking_time} onChange={(e) => setCookingTime(Number(e.target.value))} />
              </div>
              <div className="field" style={{ marginTop: 14 }}>
                <label className="label">Porsiyon</label>
                <input className="input" type="number" min={1} value={serving_count} onChange={(e) => setServingCount(Number(e.target.value))} />
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 0 }}>
              <div className="field" style={{ marginTop: 14 }}>
                <label className="label">Zorluk</label>
                <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="easy">Kolay</option>
                  <option value="medium">Orta</option>
                  <option value="hard">Zor</option>
                </select>
              </div>
              <div className="field" style={{ marginTop: 14 }}>
                <label className="label">Kategori</label>
                <select className="input" value={category_id ?? ""} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">— Seç —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="field">
              <label className="label">Görsel URL (opsiyonel)</label>
              <input className="input" value={image_url} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
            </div>
          </div>

          <div className="card" style={{ background: "linear-gradient(135deg, var(--primary-subtle), var(--ok-subtle))", borderColor: "rgba(124,92,255,0.2)" }}>
            <h3 style={{ fontWeight: 700, marginBottom: 14 }}>📋 Özet</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: "var(--muted)" }}>
              <div><strong style={{ color: "var(--text)" }}>Başlık:</strong> {title || "—"}</div>
              <div><strong style={{ color: "var(--text)" }}>Süre:</strong> {cooking_time} dk</div>
              <div><strong style={{ color: "var(--text)" }}>Porsiyon:</strong> {serving_count} kişi</div>
              <div><strong style={{ color: "var(--text)" }}>Zorluk:</strong> {{easy:"Kolay",medium:"Orta",hard:"Zor"}[difficulty]}</div>
            </div>
            <div style={{ marginTop: 24 }}>
              <button className="btn primary btn-lg" onClick={() => setStep(1)} disabled={!title.trim()}
                style={{ width: "100%", justifyContent: "center" }}>
                Malzeme Seç →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Ingredients ── */}
      {step === 1 && (
        <div className="grid" style={{ gridTemplateColumns: "1fr 380px", animation: "fadeUp 0.3s ease both" }}>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, margin: 0 }}>Malzeme Seç</h3>
              {selectedCount > 0 && <span className="badge primary">{selectedCount} seçili</span>}
            </div>

            <div style={{ position: "relative", marginBottom: 14 }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>🔍</span>
              <input className="input" placeholder="Malzeme ara…" value={ingSearch}
                onChange={(e) => setIngSearch(e.target.value)} style={{ paddingLeft: 34 }} />
            </div>

            <div style={{ maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
              {categories.map((c) => {
                const list = grouped.get(c.id) || [];
                if (!list.length) return null;
                return (
                  <div key={c.id} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase",
                      letterSpacing: 0.8, marginBottom: 8 }}>{c.name}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: 6 }}>
                      {list.map((i) => {
                        const picked = selected[i.id];
                        return (
                          <div key={i.id} className={`ing-card${picked ? " selected" : ""}`} onClick={() => toggleIng(i)}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <input type="checkbox" checked={!!picked} readOnly style={{ pointerEvents: "none", accentColor: "var(--primary)" }} />
                              <span style={{ fontSize: 13, fontWeight: 500 }}>{i.name}</span>
                            </div>
                            {picked && (
                              <div style={{ display: "flex", gap: 4, marginTop: 6 }} onClick={(e) => e.stopPropagation()}>
                                <input className="input" type="number" min={0} value={picked.quantity}
                                  onChange={(e) => setSelected((s) => ({ ...s, [i.id]: { ...s[i.id], quantity: Number(e.target.value) } }))}
                                  style={{ flex: 1, padding: "4px 6px", fontSize: 12 }} />
                                <input className="input" value={picked.unit}
                                  onChange={(e) => setSelected((s) => ({ ...s, [i.id]: { ...s[i.id], unit: e.target.value } }))}
                                  style={{ width: 60, padding: "4px 6px", fontSize: 12 }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="card" style={{ flex: 1 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Seçilen Malzemeler</h3>
              {selectedCount === 0 ? (
                <div style={{ color: "var(--muted)", fontSize: 14 }}>Henüz seçilmedi.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {Object.entries(selected).map(([id, v]) => {
                    const ing = ingredients.find((x) => x.id === Number(id));
                    return (
                      <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "6px 10px", borderRadius: "var(--radius-sm)", background: "var(--panel2)", fontSize: 13 }}>
                        <span style={{ fontWeight: 500 }}>{ing?.name}</span>
                        <span style={{ color: "var(--muted)" }}>{v.quantity} {v.unit}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn ghost" onClick={() => setStep(0)} style={{ flex: 1, justifyContent: "center" }}>← Geri</button>
              <button className="btn primary" onClick={() => setStep(2)} style={{ flex: 2, justifyContent: "center" }}>
                Talimatlar →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Instructions ── */}
      {step === 2 && (
        <div className="grid" style={{ gridTemplateColumns: "1fr 360px", animation: "fadeUp 0.3s ease both" }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Hazırlanış Adımları</h3>
            <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16 }}>
              Her adımı ayrı satıra yaz. Boş satırlar otomatik temizlenir.
            </p>
            <textarea className="input" value={instructions} onChange={(e) => setInstructions(e.target.value)}
              rows={10} placeholder={"1. Soğanı doğrayıp kavurun.\n2. Tavuğu ekleyin, mühürleyin.\n3. Baharatları ekleyin…"} />

            {instructions && (
              <div style={{ marginTop: 16 }}>
                <div className="section-title">Önizleme</div>
                {instructions.split("\n").filter(Boolean).map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginTop: 8,
                    animation: `fadeUp 0.3s ${i * 0.05}s ease both` }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                      background: "var(--primary)", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>
                      {i + 1}
                    </div>
                    <p style={{ margin: 0, fontSize: 14, paddingTop: 4, lineHeight: 1.6 }}>{s}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary & submit */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="card" style={{ background: "var(--primary-subtle)", borderColor: "rgba(124,92,255,0.2)" }}>
              <h3 style={{ fontWeight: 700, marginBottom: 14 }}>Tarif Özeti</h3>
              <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 2 }}>
                <div><strong style={{ color: "var(--text)" }}>Başlık:</strong> {title}</div>
                <div><strong style={{ color: "var(--text)" }}>Süre:</strong> {cooking_time} dk</div>
                <div><strong style={{ color: "var(--text)" }}>Porsiyon:</strong> {serving_count} kişi</div>
                <div><strong style={{ color: "var(--text)" }}>Malzeme:</strong> {selectedCount} adet</div>
                <div><strong style={{ color: "var(--text)" }}>Adım:</strong> {instructions.split("\n").filter(Boolean).length} adet</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn ghost" onClick={() => setStep(1)} style={{ flex: 1, justifyContent: "center" }}>← Geri</button>
              <button className="btn primary btn-lg" onClick={submit} disabled={loading}
                style={{ flex: 2, justifyContent: "center" }}>
                {loading ? <><Spinner size="sm" /> Kaydediliyor…</> : "✓ Yayınla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
