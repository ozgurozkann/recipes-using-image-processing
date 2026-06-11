import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="bg-background text-on-background overflow-x-hidden">

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center px-5 md:px-16 hero-mesh">
        <div className="grid md:grid-cols-2 gap-12 items-center w-full max-w-7xl mx-auto py-20">
          {/* Copy */}
          <div className="z-10 animate-fade-up">
            <span className="text-label-caps font-semibold text-secondary tracking-widest mb-4 block uppercase">
              Geleceğin Mutfağı
            </span>
            <h1 className="text-display-lg-mobile md:text-display-lg font-bold mb-6 max-w-xl leading-tight">
              Akıllı Damak,{" "}
              <span className="gradient-text">Zanaatkâr Hassasiyet.</span>
            </h1>
            <p className="text-body-lg text-on-surface-variant mb-10 max-w-lg leading-relaxed">
              Yüksek mutfak sanatı ile yapay zekanın kesiştiği noktayı deneyimleyin. Culina AI, lezzet profillerini çözerek beslenmenizi kişiselleştirir.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/recommend/manual"
                className="bg-primary text-white px-8 py-4 rounded-full font-semibold hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                <span className="material-symbols-outlined">auto_awesome</span>
                Keşfetmeye Başla
              </Link>
              <Link
                to="/recommend/image"
                className="glass-card px-8 py-4 rounded-full font-semibold text-primary hover:bg-white/60 transition-all active:scale-95 border border-primary/10"
              >
                Fotoğrafla Öneri
              </Link>
            </div>
          </div>

          {/* Art */}
          <div className="relative flex justify-center items-center">
            <div className="relative w-full max-w-md aspect-square animate-floating">
              <div className="absolute inset-0 rounded-full bg-primary-fixed/20 blur-3xl" />
              <img
                src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=700&h=700&fit=crop"
                alt="Gourmet tabak"
                className="w-full h-full object-cover rounded-[40px] shadow-2xl border-8 border-white/50"
              />
              {/* Floating badge top */}
              <div className="absolute -top-10 -right-6 glass-card p-4 rounded-2xl animate-float-sm" style={{ animationDuration: "4s" }}>
                <span className="material-symbols-outlined text-secondary block mb-1">restaurant</span>
                <p className="text-label-caps text-on-surface text-xs">Lezzet Profili</p>
                <p className="font-bold text-primary text-sm">Yüksek Doğruluk</p>
              </div>
              {/* Floating badge bottom */}
              <div className="absolute bottom-10 -left-8 glass-card p-4 rounded-2xl animate-float-sm" style={{ animationDuration: "5s" }}>
                <span className="material-symbols-outlined text-primary block mb-1">temp_preferences_custom</span>
                <p className="text-label-caps text-on-surface text-xs">Kişisel Uyum</p>
                <p className="font-bold text-secondary text-sm">%98 Eşleşme</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="px-5 md:px-16 py-24 bg-white/30">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="text-display-lg-mobile md:text-display-lg font-bold mb-4">
              Seçkin Mutfak Vizyoneri
            </h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto text-body-md">
              Gelişmiş yapay zeka organik gastronomi ile buluşuyor. Sadece kalori saymıyoruz; biyolojik imzanıza göre deneyimler tasarlıyoruz.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:h-[580px]">
            {/* Large Feature Card */}
            <Link
              to="/recommend/manual"
              className="md:col-span-8 glass-card rounded-[32px] p-10 flex flex-col justify-end relative overflow-hidden group"
            >
              <div className="absolute inset-0 z-0 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <img
                  src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&h=620&fit=crop"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary">neurology</span>
                </div>
                <h3 className="text-headline-md font-semibold mb-3">AI Lezzet Zekası</h3>
                <p className="text-on-surface-variant max-w-md">
                  Özel sinir ağımız 10.000'den fazla lezzet bileşenini analiz ederek bir sonraki isteğinizi öngörür.
                </p>
              </div>
            </Link>

            {/* Small Feature Card */}
            <div className="md:col-span-4 glass-card rounded-[32px] p-8 flex flex-col items-center text-center justify-center border-t-4 border-t-secondary/20">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-secondary text-3xl">analytics</span>
              </div>
              <h3 className="text-headline-md font-semibold mb-3">Hassas Beslenme</h3>
              <p className="text-on-surface-variant text-sm">
                Günlük performansa göre makrolarınızı ayarlayan gerçek zamanlı biyometrik geri bildirim döngüleri.
              </p>
            </div>

            {/* Solid Card */}
            <div className="md:col-span-4 bg-primary text-white rounded-[32px] p-8 flex flex-col justify-between hover:bg-primary-container transition-colors duration-500">
              <div>
                <span className="material-symbols-outlined text-4xl mb-4">eco</span>
                <h3 className="text-headline-md font-semibold mb-3">Sürdürülebilir Keşif</h3>
              </div>
              <p className="text-on-primary-container/80 text-sm">
                Hem damağa hem de gezegene saygı gösteren yenilenebilir çiftliklerden malzeme temini.
              </p>
            </div>

            {/* Wide Card */}
            <Link
              to="/recommend/image"
              className="md:col-span-8 glass-card rounded-[32px] p-10 flex items-center gap-8 overflow-hidden hover:bg-white/60 transition-all"
            >
              <div className="hidden lg:block w-1/3 aspect-square rounded-2xl overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=400&fit=crop"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-headline-md font-semibold mb-3">Mutfak Tuvali</h3>
                <p className="text-on-surface-variant mb-6 text-sm">
                  Klinik veriler ile duyusal zevk arasındaki uçurumu kapatan kişiselleştirilmiş tarif planları.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-primary/5 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter">Keto-Dostu</span>
                  <span className="bg-secondary/5 text-secondary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter">Yüksek Protein</span>
                  <span className="bg-tertiary/10 text-tertiary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter">Bitki Bazlı</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Visualization Section */}
      <section className="py-24 bg-surface-container-low overflow-hidden">
        <div className="px-5 md:px-16 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* Visual */}
          <div className="flex items-center justify-center order-2 lg:order-1">
            <div className="relative w-full aspect-square max-w-sm mx-auto">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full rounded-full border border-primary/20" style={{ animation: "spin 20s linear infinite" }} />
                <div className="absolute w-4/5 h-4/5 rounded-full border border-secondary/20" style={{ animation: "spin 15s linear infinite reverse" }} />
                <div className="absolute glass-card w-36 h-36 rounded-full flex flex-col items-center justify-center shadow-2xl">
                  <span className="text-3xl font-bold text-primary">94%</span>
                  <span className="text-label-caps text-on-surface-variant uppercase tracking-widest text-xs">Lezzet Skoru</span>
                </div>
              </div>
              <div className="absolute top-8 left-8 glass-card px-4 py-2 rounded-xl text-xs font-bold border-l-4 border-primary">Vitamin +12%</div>
              <div className="absolute bottom-16 right-0 glass-card px-4 py-2 rounded-xl text-xs font-bold border-l-4 border-secondary">Lif 24g</div>
              <div className="absolute top-1/2 right-8 glass-card px-4 py-2 rounded-xl text-xs font-bold border-l-4 border-on-surface">Protein 42g</div>
            </div>
          </div>

          {/* Text */}
          <div className="order-1 lg:order-2">
            <h2 className="text-display-lg-mobile md:text-display-lg font-bold mb-8">
              Lezzetin Klinik Hassasiyeti.
            </h2>
            <ul className="space-y-6">
              {[
                { icon: "check", title: "Moleküler Eşleştirme", desc: "Gelişmiş algoritmalar, lezzet yoğunluğunu artıran alışılmadık malzeme çiftleri bulur." },
                { icon: "check", title: "Metabolik Senkronizasyon", desc: "Tarifleriniz kalp atışı, uyku döngüsü ve glikoz seviyenizle birlikte evrilir." },
                { icon: "check", title: "Duyusal Mimari", desc: "Michelin yıldızlı şefler tarafından tasarlandı; sağlıklı hiçbir zaman tatsız anlamına gelmez." },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-4">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary material-symbols-outlined text-sm flex-shrink-0 mt-1">
                    {item.icon}
                  </span>
                  <div>
                    <p className="font-bold text-on-surface">{item.title}</p>
                    <p className="text-sm text-on-surface-variant mt-1">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-5 md:px-16">
        <div className="max-w-5xl mx-auto glass-card rounded-[48px] p-12 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-secondary/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/10 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-display-lg-mobile md:text-display-lg font-bold mb-6">
              Mutfak ufkunuzu yeniden tanımlamaya hazır mısınız?{" "}
              <span className="text-primary italic">Culina AI</span>
            </h2>
            <p className="text-body-lg text-on-surface-variant mb-12 max-w-xl mx-auto">
              Yapay zeka ile yaşam sanatında ustalaşan seçkin visyonerlerin ayrıcalıklı dünyasına katılın.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-primary text-white px-10 py-4 rounded-full font-bold hover:bg-primary-container transition-all shadow-xl shadow-primary/10 active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">person_add</span>
                Hemen Başla
              </Link>
              <Link
                to="/recipes"
                className="glass-card px-10 py-4 rounded-full font-bold text-primary border border-primary/10 hover:bg-white/60 transition-all active:scale-95"
              >
                Tarifleri Keşfet
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="culina-footer">
        <div className="culina-footer-inner">
          <div className="text-headline-md font-semibold text-primary">Culina AI</div>
          <div className="flex gap-8 flex-wrap justify-center">
            {["Gizlilik", "Şartlar", "Araştırma", "İletişim"].map((l) => (
              <span key={l} className="text-label-caps text-on-surface-variant/70 hover:text-primary transition-colors cursor-pointer">
                {l}
              </span>
            ))}
          </div>
          <p className="text-label-caps text-on-surface-variant/50">
            © 2024 Culina AI. Seçkin Mutfak Vizyoneri.
          </p>
        </div>
      </footer>
    </div>
  );
}
