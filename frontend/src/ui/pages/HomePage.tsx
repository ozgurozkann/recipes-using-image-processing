export default function HomePage() {
  return (
    <div className="grid">
      <div className="card" style={{ gridColumn: "span 7" }}>
        <h2>Hoş geldin</h2>
        <div className="muted">
          Evindeki malzemelerle en uygun tarifleri bul. Manuel seçim veya fotoğraf yükleme ile öneri al.
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <a className="btn primary" href="/recommend/manual">
            Manuel malzeme seç
          </a>
          <a className="btn primary" href="/recommend/image">
            Fotoğraf yükle
          </a>
          <a className="btn" href="/recipes">
            Tüm tarifler
          </a>
          <a className="btn" href="/recipes/popular">
            Popüler
          </a>
        </div>
      </div>

      <div className="card" style={{ gridColumn: "span 5" }}>
        <h3>Not</h3>
        <div className="muted">
          Görüntü tanıma şu an dummy çalışıyor. Model entegrasyonu için backend’de modüler servis hazır.
        </div>
        <div className="kpiRow">
          <div className="kpi">API: FastAPI</div>
          <div className="kpi">Auth: JWT</div>
          <div className="kpi">DB: SQLite</div>
        </div>
      </div>
    </div>
  );
}
