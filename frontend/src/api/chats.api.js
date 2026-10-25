import { api } from "./apiClient";

const unwrap = (data) => data?.data ?? data;

export function normalizeSession(s) {
  return {
    id: s.id ?? s._id ?? s.sessionId,
    title: s.title ?? s.name ?? "Untitled chat",
    updatedAt: s.updatedAt ?? s.createdAt ?? null,
  };
}

function normalizeSource(s) {
  if (typeof s === "string") return { snippet: s };
  return {
    documentId: s.documentId ?? s.document?.id ?? null,
    name:
      s.documentName ??
      s.fileName ??
      s.filename ??
      s.document?.fileName ??
      s.document?.name ??
      s.name ??
      null,
    page:
      s.page ?? s.pageNumber ?? s.metadata?.page ?? s.metadata?.loc?.pageNumber ?? null,
    snippet: s.snippet ?? s.text ?? s.content ?? s.pageContent ?? null,
  };
}

const normalizeSources = (raw) =>
  Array.isArray(raw) ? raw.map(normalizeSource) : [];

const toRole = (r) =>
  ["user", "human"].includes(String(r ?? "").toLowerCase()) ? "user" : "assistant";

function normalizeHistory(data) {
  const src = unwrap(data);
  const rows = Array.isArray(src)
    ? src
    : src?.messages ?? src?.history ?? src?.chats ?? [];

  const messages = rows.flatMap((m, i) => {
    const base = String(m.id ?? m._id ?? `h-${i}`);
    // Some backends store one row per question/answer pair
    if (m.question !== undefined && m.answer !== undefined) {
      return [
        { id: `${base}-q`, role: "user", content: m.question },
        {
          id: `${base}-a`,
          role: "assistant",
          content: m.answer,
          sources: normalizeSources(m.sources ?? m.citations),
        },
      ];
    }
    return [
      {
        id: base,
        role: toRole(m.role ?? m.sender ?? m.type),
        content: m.content ?? m.message ?? m.text ?? "",
        sources: normalizeSources(m.sources ?? m.citations),
        createdAt: m.createdAt ?? null,
      },
    ];
  });

  const ids =
    src?.documentIds ??
    src?.documents?.map((d) => d?.id ?? d) ??
    src?.session?.documentIds ??
    null;

  return { messages, documentIds: Array.isArray(ids) ? ids : null };
}

function normalizeAsk(data) {
  const src = unwrap(data);
  let answer =
    src?.answer ??
    src?.response ??
    src?.message ??
    src?.content ??
    (typeof src === "string" ? src : "");
  if (answer && typeof answer === "object") {
    answer = answer.content ?? answer.text ?? "";
  }
  return {
    sessionId: src?.sessionId ?? src?.session?.id ?? src?.chatSessionId ?? null,
    answer: String(answer ?? ""),
    sources: normalizeSources(src?.sources ?? src?.citations ?? src?.sourceDocuments),
  };
}

export const chatsApi = {
  ask: ({ question, sessionId, documentIds }) => {
    const body = { question, documentIds };
    if (sessionId) body.sessionId = sessionId; // omitted for new sessions
    return api.post("/chats/ask", body).then((r) => normalizeAsk(r.data));
  },

  listSessions: () =>
    api.get("/chats/get-chat-sessions").then((r) => {
      const src = unwrap(r.data);
      const list = Array.isArray(src) ? src : src?.sessions ?? src?.items ?? [];
      return list.map(normalizeSession);
    }),

  getHistory: (sessionId) =>
    api
      .get(`/chats/${encodeURIComponent(sessionId)}/get-chat-history`)
      .then((r) => normalizeHistory(r.data)),

  renameSession: (sessionId, title) =>
    api
      .put(`/chats/${encodeURIComponent(sessionId)}/rename-chat-session`, { title })
      .then((r) => r.data),

  deleteSession: (sessionId) =>
    api
      .delete(`/chats/${encodeURIComponent(sessionId)}/delete-chat-session`)
      .then((r) => r.data),
};