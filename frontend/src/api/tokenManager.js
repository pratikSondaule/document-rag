const ACCESS_KEY = 'documind_access_token';
const REFRESH_KEY = 'documind_refresh_token';

const read = (key) => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const write = (key, value) => {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch { /* storage unavailable */ }
};

export const tokenManager = {
  getAccess: () => read(ACCESS_KEY),
  getRefresh: () => read(REFRESH_KEY),
  setTokens: ({ accessToken, refreshToken }) => {
    if (accessToken) write(ACCESS_KEY, accessToken);
    if (refreshToken) write(REFRESH_KEY, refreshToken); // handles rotation too
  },
  clear: () => {
    write(ACCESS_KEY, null);
    write(REFRESH_KEY, null);
  },
};

let onAuthFailure = null;
export const setAuthFailureHandler = (fn) => { onAuthFailure = fn; };
export const notifyAuthFailure = () => onAuthFailure?.();

export function extractTokens(data) {
  const src = data?.data ?? data ?? {};
  return {
    accessToken: src.accessToken ?? src.access_token ?? null,
    refreshToken: src.refreshToken ?? src.refresh_token ?? null,
  };
}