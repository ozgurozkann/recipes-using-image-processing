import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

type Stats = { recipes: number; ingredients: number };

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      api<{ total: number }>("GET", "/recipes?limit=1"),
      api<{ items: unknown[] }>("GET", "/ingredients"),
    ])
      .then(([r, i]) => setStats({ recipes: r.total, ingredients: i.items.length }))
      .catch(() => {});
  }, []);

  return (
    <main className="savor-page">
      <section className="savor-hero">
        <div className="savor-hero-grid">
          <div className="savor-copy">
            <span className="savor-kicker">AI destekli tarif pusulası</span>
            <h1>Evindeki malzemelerle doğru tarifi bul.</h1>
            <p>Fotoğraf yükle, malzemelerini seç ya da tüm tarifleri keşfet. Sistem elindekilere göre sana en uygun seçenekleri çıkarır.</p>
            <div className="savor-actions">
              <Link to="/recommend/image" className="savor-btn primary">Fotoğraf Yükle</Link>
              <Link to="/recommend/manual" className="savor-btn">Manuel Seçim</Link>
            </div>
          </div>
          <div className="savor-hero-art">
            <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=760&h=860&fit=crop&auto=format" alt="Taze malzemelerle hazırlanmış renkli tarif tabağı" />
            <div className="savor-float-card savor-float-card-top">
              <strong>{stats?.recipes ?? "500+"}</strong>
              <span>tarif</span>
            </div>
            <div className="savor-float-card savor-float-card-bottom">
              <strong>{stats?.ingredients ?? "100+"}</strong>
              <span>malzeme</span>
            </div>
          </div>
        </div>
      </section>

      <section className="savor-section">
        <div className="savor-section-head">
          <span>Keşif yolları</span>
          <h2>Mutfağına göre ilerle</h2>
        </div>
        <div className="savor-bento">
          <Link to="/recommend/manual" className="savor-card savor-card-large">
            <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&h=620&fit=crop&auto=format" alt="Sebze seçimi" />
            <div><span>Malzeme seç</span><h3>Elindekileri işaretle, uyumlu tarifleri sırala.</h3></div>
          </Link>
          <Link to="/recipes/popular" className="savor-card savor-card-solid">
            <span>Popüler</span>
            <h3>En çok sevilen tarifleri gör.</h3>
          </Link>
          <Link to="/recipes" className="savor-card savor-card-center">
            <span>Tüm tarifler</span>
            <h3>Arama ve filtrelerle geniş listeyi keşfet.</h3>
          </Link>
          <Link to="/recommend/image" className="savor-card savor-card-wide">
            <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=900&h=520&fit=crop&auto=format" alt="Fotoğrafla tarif önerisi" />
            <div><span>Görsel tanıma</span><h3>Malzemeleri fotoğraftan analiz et.</h3></div>
          </Link>
        </div>
      </section>

      <section className="savor-cta">
        <h2>Bugün ne pişireceğini birlikte bulalım.</h2>
        <p>Başlamak için malzemelerini seçmen yeterli.</p>
        <Link to="/recommend/manual" className="savor-btn primary">Tarif Öner</Link>
      </section>
    </main>
  );
}
