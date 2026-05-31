import { Navigate } from "react-router-dom";
import { getToken } from "../authStore";

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

