import { apiFetch } from "./apiClient";
import { clearAuthSession, saveAuthSession } from "../utils/authSession";

export async function login({ email, password, rememberMe = false }) {
  const data = await apiFetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, rememberMe }),
  });
  saveAuthSession(data, rememberMe);
  return data;
}

export async function register({ fullName, email, password }) {
  const data = await apiFetch("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName, email, password }),
  });
  saveAuthSession(data, false);
  return data;
}

export async function fetchCurrentUser() {
  return apiFetch("/api/v1/auth/me");
}

export async function logout() {
  try {
    await apiFetch("/api/v1/auth/logout", { method: "POST", parseJson: false });
  } finally {
    clearAuthSession();
  }
}
