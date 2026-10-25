import { api } from "./apiClient";

function normalizeUser(body) {
  const src = body?.data?.user ?? body?.user ?? body?.data ?? body ?? {};
  const safe = { ...src };
  delete safe.password; // never keep this in client state

  safe.name =
    src.name ||
    src.fullName ||
    [src.firstName, src.lastName].filter(Boolean).join(" ") ||
    src.username ||
    null;
  safe.email = src.email ?? null;
  return safe;
}

export const authApi = {
  register: (payload) => api.post("/auth/register", payload).then((r) => r.data),
  login: (payload) => api.post("/auth/login", payload).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => normalizeUser(r.data)),
};