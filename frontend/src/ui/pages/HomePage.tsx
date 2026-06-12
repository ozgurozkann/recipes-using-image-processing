import { Link } from "react-router-dom";
import { useLanguage } from "../i18n";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="bg-background text-on-background overflow-x-hidden">

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center px-5 md:px-16 hero-mesh">
        <div className="grid md:grid-cols-2 gap-12 items-center w-full max-w-7xl mx-auto py-20">
          {/* Copy */}
          <div className="z-10 animate-fade-up">
            <span className="text-label-caps font-semibold text-secondary tracking-widest mb-4 block uppercase">
              {t("home_eyebrow")}
            </span>
            <h1 className="text-display-lg-mobile md:text-display-lg font-bold mb-6 max-w-xl leading-tight">
              {t("home_h1a")}{" "}
              <span className="gradient-text">{t("home_h1b")}</span>
            </h1>
            <p className="text-body-lg text-on-surface-variant mb-10 max-w-lg leading-relaxed">
              {t("home_hero_desc")}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/recommend/manual"
                className="bg-primary text-white px-8 py-4 rounded-full font-semibold hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                <span className="material-symbols-outlined">auto_awesome</span>
                {t("home_hero_cta")}
              </Link>
            </div>
          </div>

          {/* Art */}
          <div className="relative flex justify-center items-center">
            <div className="relative w-full max-w-md aspect-square animate-floating">
              <div className="absolute inset-0 rounded-full bg-primary-fixed/20 blur-3xl" />
              <img
                src="https://images.unsplash.com/photo-1543362906-acfc16c67564?w=700&h=700&fit=crop"
                alt="Malzemeler"
                className="w-full h-full object-cover rounded-[40px] shadow-2xl border-8 border-white/50"
              />
              {/* Floating badge top */}
              <div className="absolute -top-10 -right-6 glass-card p-4 rounded-2xl animate-float-sm" style={{ animationDuration: "4s" }}>
                <span className="material-symbols-outlined text-secondary block mb-1">photo_camera</span>
                <p className="text-label-caps text-on-surface text-xs">{t("home_badge_flavor")}</p>
                <p className="font-bold text-primary text-sm">{t("home_badge_accuracy")}</p>
              </div>
              {/* Floating badge bottom */}
              <div className="absolute bottom-10 -left-8 glass-card p-4 rounded-2xl animate-float-sm" style={{ animationDuration: "5s" }}>
                <span className="material-symbols-outlined text-primary block mb-1">auto_awesome</span>
                <p className="text-label-caps text-on-surface text-xs">{t("home_badge_fit")}</p>
                <p className="font-bold text-secondary text-sm">{t("home_badge_match")}</p>
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
              {t("home_feat_h2")}
            </h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto text-body-md">
              {t("home_feat_desc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:h-[580px]">
            {/* Large Feature Card — Fotoğrafla Malzeme Tara */}
            <Link
              to="/recommend"
              className="md:col-span-8 glass-card rounded-[32px] p-10 flex flex-col justify-end relative overflow-hidden group"
            >
              <div className="absolute inset-0 z-0 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <img
                  src="https://images.unsplash.com/photo-1543362906-acfc16c67564?w=900&h=620&fit=crop"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary">center_focus_strong</span>
                </div>
                <h3 className="text-headline-md font-semibold mb-3">{t("home_feat_ai_h3")}</h3>
                <p className="text-on-surface-variant max-w-md">
                  {t("home_feat_ai_desc")}
                </p>
              </div>
            </Link>

            {/* Small Feature Card — Topluluk Tarifleri */}
            <Link to="/recipes" className="md:col-span-4 glass-card rounded-[32px] p-8 flex flex-col items-center text-center justify-center border-t-4 border-t-secondary/20 hover:bg-white/60 transition-all">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-secondary text-3xl">groups</span>
              </div>
              <h3 className="text-headline-md font-semibold mb-3">{t("home_feat_nutrition_h3")}</h3>
              <p className="text-on-surface-variant text-sm">
                {t("home_feat_nutrition_desc")}
              </p>
            </Link>

            {/* Solid Card — Adım Adım Pişir */}
            <div className="md:col-span-4 bg-primary text-white rounded-[32px] p-8 flex flex-col justify-between hover:bg-primary-container transition-colors duration-500">
              <div>
                <span className="material-symbols-outlined text-4xl mb-4">soup_kitchen</span>
                <h3 className="text-headline-md font-semibold mb-3">{t("home_feat_sustain_h3")}</h3>
              </div>
              <p className="text-white/80 text-sm">
                {t("home_feat_sustain_desc")}
              </p>
            </div>

            {/* Wide Card — Manuel Malzeme Seç */}
            <Link
              to="/recommend"
              className="md:col-span-8 glass-card rounded-[32px] p-10 flex items-center gap-8 overflow-hidden hover:bg-white/60 transition-all"
            >
              <div className="hidden lg:block w-1/3 aspect-square rounded-2xl overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=400&h=400&fit=crop"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-headline-md font-semibold mb-3">{t("home_feat_canvas_h3")}</h3>
                <p className="text-on-surface-variant mb-6 text-sm">
                  {t("home_feat_canvas_desc")}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-primary/5 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter">{t("home_feat_keto")}</span>
                  <span className="bg-secondary/5 text-secondary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter">{t("home_feat_protein")}</span>
                  <span className="bg-tertiary/10 text-tertiary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter">{t("home_feat_plant")}</span>
                </div>
              </div>
            </Link>
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
              {t("home_cta_h2")}{" "}
              <span className="text-primary italic">Recipe AI</span>
            </h2>
            <p className="text-body-lg text-on-surface-variant mb-12 max-w-xl mx-auto">
              {t("home_cta_desc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/recommend"
                className="bg-primary text-white px-10 py-4 rounded-full font-bold hover:bg-primary-container transition-all shadow-xl shadow-primary/10 active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">person_add</span>
                {t("home_cta_start")}
              </Link>
              <Link
                to="/recipes"
                className="glass-card px-10 py-4 rounded-full font-bold text-primary border border-primary/10 hover:bg-white/60 transition-all active:scale-95"
              >
                {t("home_cta_browse")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="culina-footer">
        <div className="culina-footer-inner">
          <div className="text-headline-md font-semibold text-primary">Recipe AI</div>
          <div className="flex gap-8 flex-wrap justify-center">
            {[t("footer_privacy"), t("footer_terms"), t("footer_research"), t("footer_contact")].map((l) => (
              <span key={l} className="text-label-caps text-on-surface-variant/70 hover:text-primary transition-colors cursor-pointer">
                {l}
              </span>
            ))}
          </div>
          <p className="text-label-caps text-on-surface-variant/50">
            {t("footer_copy")}
          </p>
        </div>
      </footer>
    </div>
  );
}
