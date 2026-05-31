import { Link, Route, Routes } from "react-router-dom";
import { getToken, logout } from "../ui/authStore";
import RequireAuth from "./components/RequireAuth";
import HomePage from "../ui/pages/HomePage";
import LoginPage from "../ui/pages/LoginPage";
import RegisterPage from "../ui/pages/RegisterPage";
import ManualRecommendPage from "../ui/pages/ManualRecommendPage";
import ImageRecommendPage from "../ui/pages/ImageRecommendPage";
import RecipesPage from "../ui/pages/RecipesPage";
import RecipeDetailPage from "../ui/pages/RecipeDetailPage";
import FavoritesPage from "../ui/pages/FavoritesPage";
import SavedPage from "../ui/pages/SavedPage";
import ProfilePage from "../ui/pages/ProfilePage";
import PopularRecipesPage from "../ui/pages/PopularRecipesPage";
import AddRecipePage from "../ui/pages/AddRecipePage";
import AdminPage from "../ui/pages/AdminPage";

export default function App() {
  const token = getToken();
  return (
    <div className="container">
      <header className="topbar">
        <div className="nav">
          <div className="brand">
            <Link to="/">Recipes</Link>
            <span className="badge">MVP+</span>
          </div>
          <Link to="/recipes">Tarifler</Link>
          <Link to="/recipes/popular">Popüler</Link>
          <Link to="/recommend/manual">Manuel</Link>
          <Link to="/recommend/image">Fotoğraf</Link>
          {token && <Link to="/recipes/add">Tarif Ekle</Link>}
          {token && <Link to="/admin">Admin</Link>}
        </div>
        <div className="nav">
          {token ? (
            <>
              <Link to="/favorites">Favoriler</Link>
              <Link to="/saved">Kaydedilenler</Link>
              <Link to="/profile">Profil</Link>
              <button className="btn danger" onClick={logout}>
                Çıkış
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Giriş</Link>
              <Link to="/register">Kayıt</Link>
            </>
          )}
        </div>
      </header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipes/popular" element={<PopularRecipesPage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        <Route
          path="/recipes/add"
          element={
            <RequireAuth>
              <AddRecipePage />
            </RequireAuth>
          }
        />
        <Route
          path="/favorites"
          element={
            <RequireAuth>
              <FavoritesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/saved"
          element={
            <RequireAuth>
              <SavedPage />
            </RequireAuth>
          }
        />
        <Route path="/recommend/manual" element={<ManualRecommendPage />} />
        <Route
          path="/recommend/image"
          element={
            <RequireAuth>
              <ImageRecommendPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminPage />
            </RequireAuth>
          }
        />
      </Routes>
    </div>
  );
}
