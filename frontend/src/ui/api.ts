import { clearToken, getToken } from "./authStore";

export async function api<T>(method: string, path: string, body?: unknown, isForm?: boolean): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body && !isForm) headers["Content-Type"] = "application/json";

  const res = await fetch(path, {
    method,
    headers,
    body: body ? (isForm ? (body as BodyInit) : JSON.stringify(body)) : undefined
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const detail = data?.detail;
    const msg = Array.isArray(detail)
      ? detail.map((d: any) => d.msg).join(", ")
      : (typeof detail === "string" ? detail : `HTTP ${res.status}`);
    if (res.status === 401 && (msg === "Invalid token" || msg === "User not found")) {
      clearToken();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      throw new Error("Oturum gecersiz. Lutfen tekrar giris yapin.");
    }
    throw new Error(msg);
  }
  return data as T;
}

