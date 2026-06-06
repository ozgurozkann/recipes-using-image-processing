const key = "recipes_token";

export function getToken(): string {
  return localStorage.getItem(key) || "";
}

export function setToken(token: string) {
  localStorage.setItem(key, token);
  window.location.href = "/";
}

export function clearToken() {
  localStorage.removeItem(key);
}

export function logout() {
  clearToken();
  window.location.href = "/";
}
