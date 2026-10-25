import axios from "axios";
import {
  tokenManager,
  extractTokens,
  notifyAuthFailure,
} from "./tokenManager";

const baseURL = import.meta.env.VITE_API_BASE_URL;

// ---- Main instance ----
export const api = axios.create({ baseURL });

// Bare instance for refresh: no interceptors, so no recursion
const refreshClient = axios.create({ baseURL });

// One shared refresh promise so concurrent 401s trigger a single request
let refreshPromise = null;
export function refreshAccessToken() {
  if (!refreshPromise) {
    const refreshToken = tokenManager.getRefresh();
    if (!refreshToken) return Promise.reject(new Error("No refresh token."));

    refreshPromise = refreshClient
      .post("/auth/refresh", { refreshToken })
      .then((res) => {
        const tokens = extractTokens(res.data);
        if (!tokens.accessToken) {
          throw new Error("Refresh response did not include an access token.");
        }
        tokenManager.setTokens(tokens);
        return tokens.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

const AUTH_PATHS = ["/auth/login", "/auth/register", "/auth/refresh"];

api.interceptors.request.use((config) => {
  const token = tokenManager.getAccess();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthCall = AUTH_PATHS.some((p) => original?.url?.includes(p));

    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      isAuthCall
    ) {
      return Promise.reject(error);
    }

    original._retry = true; // retry at most once
    try {
      const token = await refreshAccessToken();
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch {
      tokenManager.clear();
      notifyAuthFailure();
      return Promise.reject(error);
    }
  }
);