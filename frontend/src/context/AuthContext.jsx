import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authApi } from "../api/auth.api";
import {
  extractTokens,
  setAuthFailureHandler,
  tokenManager,
} from "../api/tokenManager";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | authenticated | unauthenticated

  const resetAuth = useCallback(() => {
    tokenManager.clear();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  // Restore the session on load
  useEffect(() => {
    let active = true;
    setAuthFailureHandler(resetAuth);

    (async () => {
      // No stored session, so skip the network calls
      if (!tokenManager.getAccess() && !tokenManager.getRefresh()) {
        if (active) setStatus("unauthenticated");
        return;
      }
      try {
        // If the access token is expired, the interceptor refreshes and retries
        const me = await authApi.me();
        if (!active) return;
        setUser(me);
        setStatus("authenticated");
      } catch {
        if (active) resetAuth();
      }
    })();

    return () => {
      active = false;
    };
  }, [resetAuth]);

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    const tokens = extractTokens(data);
    if (!tokens.accessToken)
      throw new Error("Unexpected server response. Please try again.");
    tokenManager.setTokens(tokens);
    try {
      const me = await authApi.me();
      setUser(me);
      setStatus("authenticated");
    } catch (err) {
      tokenManager.clear();
      throw err;
    }
  }, []);

  const register = useCallback((payload) => authApi.register(payload), []);

  const logout = useCallback(async () => {
    resetAuth(); // clears localStorage tokens too
  }, [resetAuth]);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated",
      login,
      register,
      logout,
    }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
