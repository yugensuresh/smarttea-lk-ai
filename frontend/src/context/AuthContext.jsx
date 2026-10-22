import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchCurrentUser, logout as logoutApi } from "../api/authApi";
import {
  AUTH_CHANGED_EVENT,
  clearAuthSession,
  getAccessToken,
  patchStoredUser,
  readStoredUser,
} from "../utils/authSession";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");

  const refresh = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setStatus("anonymous");
      return;
    }
    setUser(readStoredUser());
    setStatus("authenticated");
    try {
      const me = await fetchCurrentUser();
      patchStoredUser(me);
      setUser(me);
      setStatus("authenticated");
    } catch {
      clearAuthSession();
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  useEffect(() => {
    refresh();
    function onAuthChanged() {
      refresh();
    }
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  }, [refresh]);

  const signOut = useCallback(async () => {
    await logoutApi();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated" && Boolean(user),
      refresh,
      signOut,
    }),
    [user, status, refresh, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
