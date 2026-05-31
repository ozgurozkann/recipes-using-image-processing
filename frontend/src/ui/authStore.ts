const key = "recipes_token";

export function getToken(): string {
  return localStorage.getItem(key) || "";
}

export function setToken(token: string) {
  localStorage.setItem(key, token);
  window.location.href = "/";
}

export function logout() {
  localStorage.removeItem(key);
  window.location.href = "/";
}

