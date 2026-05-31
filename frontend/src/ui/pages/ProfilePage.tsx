import { useEffect, useState } from "react";
import { api } from "../api";

type Me = { id: number; full_name: string; email: string; role: string };

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api<Me>("GET", "/auth/me").then(setMe).catch((e) => setErr(e.message));
  }, []);

  return (
    <div className="grid">
      <div className="card" style={{ gridColumn: "span 12" }}>
      <h2>Profilim</h2>
      {err && <div className="error" style={{ marginTop: 12 }}>{err}</div>}
      {me && (
        <div className="kpiRow">
          <div className="kpi">ID: {me.id}</div>
          <div className="kpi">Ad: {me.full_name || "—"}</div>
          <div className="kpi">E-posta: {me.email}</div>
          <div className="kpi">Rol: {me.role}</div>
        </div>
      )}
      </div>
    </div>
  );
}
