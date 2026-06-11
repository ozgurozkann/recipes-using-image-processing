import { useEffect, useState } from "react";
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
import CombinedRecommendPage from "./pages/CombinedRecommendPage";
import RecipesPage from "./pages/RecipesPage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import FavoritesPage from "./pages/FavoritesPage";
import SavedPage from "./pages/SavedPage";
import ProfilePage from "./pages/ProfilePage";
import PopularRecipesPage from "./pages/PopularRecipesPage";
import AddRecipePage from "./pages/AddRecipePage";
import MyRecipesPage from "./pages/MyRecipesPage";
import EditRecipePage from "./pages/EditRecipePage";
import AdminPage from "./pages/AdminPage";

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isActive =
    to === "/recipes"
      ? pathname === "/recipes" || /^\/recipes\/\d+/.test(pathname)
      : pathname === to || (to !== "/" && pathname.startsWith(`${to}/`));
  return (
    <Link to={to} className={`topnav-link ${isActive ? "active" : ""}`}>
      {children}
    </Link>
  );
}

export default function App() {
  const token = getToken();
  const [role, setRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { pathname } = useLocation();

  // Auth pages have simplified navbar
  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    if (!token) { setRole(""); setAvatarUrl(null); return; }
    api<{ role: string; avatar_url?: string | null }>("GET", "/auth/me")
      .then((me) => { setRole(me.role); setAvatarUrl(me.avatar_url ?? null); })
      .catch(() => { setRole(""); setAvatarUrl(null); });
  }, [token]);

  useEffect(() => {
    const handler = (e: Event) => setAvatarUrl((e as CustomEvent<string | null>).detail);
    window.addEventListener("avatar-updated", handler);
    return () => window.removeEventListener("avatar-updated", handler);
  }, []);

  return (
    <>
      {/* Top Navigation */}
      <header className="topnav">
        <div className="topnav-inner">
          {/* Left: Brand + Nav links */}
          <div className="flex items-center gap-8 min-w-0">
            <Link to="/" className="topnav-brand">Recipe AI</Link>
            {!isAuthPage && (
              <nav className="topnav-links hidden md:flex">
                <NavLink to="/recipes">Tarifler</NavLink>
                <NavLink to="/recipes/popular">Popüler</NavLink>
                {token && <NavLink to="/recommend">Öneri</NavLink>}
                {token && <NavLink to="/my-recipes">Tariflerim</NavLink>}
                {token && <NavLink to="/recipes/add">Tarif Ekle</NavLink>}
                {role === "admin" && <NavLink to="/admin">Admin</NavLink>}
              </nav>
            )}
          </div>

          {/* Right: Actions */}
          <div className="topnav-actions">
            {token ? (
              <>
                <Link className="topnav-icon-btn" to="/favorites" title="Favoriler">
                  <span className="material-symbols-outlined">favorite</span>
                </Link>
                <Link className="topnav-icon-btn" to="/saved" title="Kaydettiklerim">
                  <span className="material-symbols-outlined">bookmark</span>
                </Link>
                <Link className="topnav-icon-btn" to="/profile" title="Profil">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="Profil" className="w-6 h-6 rounded-full object-cover ring-2 ring-primary/30" />
                    : <span className="material-symbols-outlined">account_circle</span>
                  }
                </Link>
                <button className="topnav-icon-btn" onClick={logout} title="Çıkış" style={{ color: "#ba1a1a" }}>
                  <span className="material-symbols-outlined">logout</span>
                </button>
              </>
            ) : (
              <>
                <Link className="btn-auth-secondary hidden sm:block" to="/login">Giriş</Link>
                <Link className="btn-auth-primary" to="/register">Kayıt Ol</Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        {!isAuthPage && (
          <nav className="flex md:hidden gap-4 px-5 pb-3 overflow-x-auto scrollbar-hide" style={{ borderTop: "1px solid rgba(28,27,27,0.05)" }}>
            <NavLink to="/recipes">Tarifler</NavLink>
            <NavLink to="/recipes/popular">Popüler</NavLink>
            {token && <NavLink to="/recommend">Öneri</NavLink>}
            {token && <NavLink to="/recipes/add">Tarif Ekle</NavLink>}
            {role === "admin" && <NavLink to="/admin">Admin</NavLink>}
          </nav>
        )}
      </header>

      {/* Page Content */}
      <div className="page-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/recipes/popular" element={<PopularRecipesPage />} />
          <Route path="/recipes/add" element={<RequireAuth><AddRecipePage /></RequireAuth>} />
          <Route path="/recipes/edit/:id" element={<RequireAuth><EditRecipePage /></RequireAuth>} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          <Route path="/my-recipes" element={<RequireAuth><MyRecipesPage /></RequireAuth>} />
          <Route path="/favorites" element={<RequireAuth><FavoritesPage /></RequireAuth>} />
          <Route path="/saved" element={<RequireAuth><SavedPage /></RequireAuth>} />
          <Route path="/recommend" element={<RequireAuth><CombinedRecommendPage /></RequireAuth>} />
          <Route path="/recommend/manual" element={<RequireAuth><ManualRecommendPage /></RequireAuth>} />
          <Route path="/recommend/image" element={<RequireAuth><ImageRecommendPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth><AdminPage /></RequireAuth>} />
        </Routes>
      </div>

      <ToastContainer />
    </>
  );
}
