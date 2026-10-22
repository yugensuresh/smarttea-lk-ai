const SESSION_KEY = "smarttea.auth.session";
const REMEMBER_KEY = "smarttea.auth.remember";
export const AUTH_CHANGED_EVENT = "smarttea-lk:auth-changed";

function notifyAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
  }
}

function storageFor(remember) {
  return remember ? window.localStorage : window.sessionStorage;
}

export function saveAuthSession(response, rememberMe = false) {
  const payload = {
    accessToken: response.accessToken,
    tokenType: response.tokenType ?? "Bearer",
    expiresIn: response.expiresIn,
    user: response.user,
  };
  window.sessionStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(SESSION_KEY);
  storageFor(rememberMe).setItem(SESSION_KEY, JSON.stringify(payload));
  if (rememberMe) {
    window.localStorage.setItem(REMEMBER_KEY, "1");
  } else {
    window.localStorage.removeItem(REMEMBER_KEY);
  }
  notifyAuthChanged();
}

export function readAuthSession() {
  const remembered = window.localStorage.getItem(REMEMBER_KEY) === "1";
  const raw =
    window.localStorage.getItem(SESSION_KEY) ?? window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return { ...JSON.parse(raw), remember: remembered };
  } catch {
    clearAuthSession();
    return null;
  }
}

export function getAccessToken() {
  return readAuthSession()?.accessToken ?? null;
}

export function clearAuthSession() {
  window.sessionStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(REMEMBER_KEY);
  notifyAuthChanged();
}

export function readStoredUser() {
  return readAuthSession()?.user ?? null;
}

/** Persist user fields returned from GET /me without rotating the token. */
export function patchStoredUser(user) {
  const session = readAuthSession();
  if (!session?.accessToken || !user) return;
  const remember = window.localStorage.getItem(REMEMBER_KEY) === "1";
  const payload = {
    accessToken: session.accessToken,
    tokenType: session.tokenType ?? "Bearer",
    expiresIn: session.expiresIn,
    user,
  };
  storageFor(remember).setItem(SESSION_KEY, JSON.stringify(payload));
}
