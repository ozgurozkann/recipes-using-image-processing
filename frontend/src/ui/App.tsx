import { Link, Route, Routes, useLocation } from "react-router-dom";
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

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isActive = pathname === to || (to !== "/" && pathname.startsWith(to));
  return (
    <Link to={to} className={`nav-link ${isActive ? "active" : ""}`}>
      {children}
    </Link>
  );
}

export default function App() {
  const token = getToken();
  return (
    <>
      <div className="container">
        <header className="topbar">
          <div className="nav">
            <Link to="/" className="brand" style={{ textDecoration: "none" }}>
              <span className="brand-dot" />
              Recipes
            </Link>
            <NavLink to="/recipes">Tarifler</NavLink>
            <NavLink to="/recipes/popular">Popüler</NavLink>
            <NavLink to="/recommend/manual">Manuel</NavLink>
            <NavLink to="/recommend/image">Fotoğraf</NavLink>
            {token && <NavLink to="/recipes/add">Tarif Ekle</NavLink>}
            {token && <NavLink to="/admin">Admin</NavLink>}
          </div>
          <div className="nav">
            {token ? (
              <>
                <NavLink to="/favorites">♡ Favoriler</NavLink>
                <NavLink to="/saved">⬇ Kaydettiklerim</NavLink>
                <NavLink to="/profile">Profil</NavLink>
                <button
                  className="btn btn-sm danger"
                  onClick={logout}
                  style={{ marginLeft: 4 }}
                >
                  Çıkış
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login">Giriş</NavLink>
                <Link to="/register" className="btn btn-sm primary" style={{ marginLeft: 4 }}>
                  Kayıt Ol
                </Link>
              </>
            )}
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
