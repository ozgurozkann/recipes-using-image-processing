import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { api } from "./api";
import { getToken, logout } from "./authStore";
import RequireAuth from "./components/RequireAuth";
import ToastContainer from "./components/Toast";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ManualRecommendPage from "./pages/ManualRecommendPage";
import ImageRecommendPage from "./pages/ImageRecommendPage";
import RecipesPage from "./pages/RecipesPage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import FavoritesPage from "./pages/FavoritesPage";
import SavedPage from "./pages/SavedPage";
import ProfilePage from "./pages/ProfilePage";
import PopularRecipesPage from "./pages/PopularRecipesPage";
import AddRecipePage from "./pages/AddRecipePage";
import AdminPage from "./pages/AdminPage";

function getInitialTheme(): "dark" | "light" {
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored;
  } catch {}
  return "dark";
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isActive =
    to === "/recipes"
      ? pathname === "/recipes" || /^\/recipes\/\d+/.test(pathname)
      : pathname === to || (to !== "/" && pathname.startsWith(`${to}/`));
  return (
    <Link to={to} className={`nav-link ${isActive ? "active" : ""}`}>
      {children}
    </Link>
  );
}

export default function App() {
  const token = getToken();
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme);
  const [role, setRole] = useState("");
  const navRef = useRef<HTMLElement | null>(null);
  const [navIndicator, setNavIndicator] = useState({ left: 0, width: 0, visible: false });
  const { pathname } = useLocation();
  const isFullBleedLightPage = ["/", "/recommend/manual", "/recommend/image", "/recipes", "/recipes/popular", "/login", "/admin"].includes(pathname);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch {}
  }, [theme]);

  useEffect(() => {
    if (!token) {
      setRole("");
      return;
    }
    api<{ role: string }>("GET", "/auth/me")
      .then((me) => setRole(me.role))
      .catch(() => setRole(""));
  }, [token]);

  useLayoutEffect(() => {
    function updateNavIndicator() {
      const nav = navRef.current;
      const active = nav?.querySelector<HTMLElement>(".nav-link.active");
      if (!nav || !active) {
        setNavIndicator((current) => ({ ...current, visible: false }));
        return;
      }

      const navRect = nav.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      setNavIndicator({
        left: activeRect.left - navRect.left + nav.scrollLeft,
        width: activeRect.width,
        visible: true,
      });
    }

    updateNavIndicator();
    window.addEventListener("resize", updateNavIndicator);
    const nav = navRef.current;
    nav?.addEventListener("scroll", updateNavIndicator, { passive: true });
    return () => {
      window.removeEventListener("resize", updateNavIndicator);
      nav?.removeEventListener("scroll", updateNavIndicator);
    };
  }, [pathname, role, token]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return (
    <>
      <div className={`container ${isFullBleedLightPage ? "landing-shell" : ""}`}>
        <header className="topbar">
          <div className="topbar-inner">
            <div className="topbar-left">
              <Link to="/" className="brand" aria-label="Culina AI ana sayfa">
                Culina AI
              </Link>
              <nav className="nav-links" aria-label="Ana menü" ref={navRef}>
                <span
                  className={`nav-active-indicator ${navIndicator.visible ? "visible" : ""}`}
                  style={{ transform: `translateX(${navIndicator.left}px)`, width: navIndicator.width }}
                  aria-hidden="true"
                />
                <NavLink to="/recipes">Tarifler</NavLink>
                <NavLink to="/recipes/popular">Popüler</NavLink>
                <NavLink to="/recommend/image">Fotoğraf</NavLink>
                <NavLink to="/recommend/manual">Manuel</NavLink>
                {token && <NavLink to="/recipes/add">Tarif Ekle</NavLink>}
                {role === "admin" && <NavLink to="/admin">Admin</NavLink>}
              </nav>
            </div>

            <div className="topbar-actions">
              <label className="nav-search" aria-label="Tarif ara">
                <span className="material-symbols-outlined">search</span>
                <input placeholder="Search recipes..." type="search" />
              </label>
              {token ? (
                <>
                  <Link className="topbar-icon-btn" to="/favorites" title="Favoriler" aria-label="Favoriler">
                    <span className="material-symbols-outlined">favorite</span>
                  </Link>
                  <Link className="topbar-icon-btn" to="/saved" title="Kaydettiklerim" aria-label="Kaydettiklerim">
                    <span className="material-symbols-outlined">bookmark</span>
                  </Link>
                  <Link className="topbar-icon-btn" to="/profile" title="Profil" aria-label="Profil">
                    <span className="material-symbols-outlined">account_circle</span>
                  </Link>
                  <button className="topbar-icon-btn danger" onClick={logout} title="Çıkış" aria-label="Çıkış">
                    <span className="material-symbols-outlined">logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link className="nav-auth-link" to="/login">Giriş</Link>
                  <Link className="nav-auth-primary" to="/register">Kayıt Ol</Link>
                </>
              )}
              <button
                className="topbar-icon-btn"
                onClick={toggleTheme}
                title={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
                aria-label={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
              >
                <span className="material-symbols-outlined">{theme === "dark" ? "light_mode" : "dark_mode"}</span>
              </button>
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/recipes/popular" element={<PopularRecipesPage />} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          <Route path="/recipes/add" element={<RequireAuth><AddRecipePage /></RequireAuth>} />
          <Route path="/favorites" element={<RequireAuth><FavoritesPage /></RequireAuth>} />
          <Route path="/saved" element={<RequireAuth><SavedPage /></RequireAuth>} />
          <Route path="/recommend/manual" element={<ManualRecommendPage />} />
          <Route path="/recommend/image" element={<RequireAuth><ImageRecommendPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth><AdminPage /></RequireAuth>} />
        </Routes>
      </div>
      <ToastContainer />
    </>
  );
}
