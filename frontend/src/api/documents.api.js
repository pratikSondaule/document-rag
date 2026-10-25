import { api } from "./apiClient";

// Change this to match your backend's FileInterceptor('...') field name
const UPLOAD_FIELD = "file";

const pickList = (data) =>
  Array.isArray(data)
    ? data
    : data?.documents ?? data?.data ?? data?.items ?? [];

export function normalizeDocument(d) {
  return {
    id: d.id ?? d._id,
    name:
      d.fileName ??
      d.originalName ??
      d.filename ??
      d.name ??
      d.title ??
      "Untitled document",
    status: String(d.embeddingStatus ?? d.status ?? "").toLowerCase(),
    createdAt: d.createdAt ?? d.uploadedAt ?? null,
  };
}

export const documentsApi = {
  list: () =>
    api.get("/documents").then((r) => pickList(r.data).map(normalizeDocument)),

  upload: (file, onProgress) => {
    const form = new FormData();
    form.append(UPLOAD_FIELD, file);
    // No Content-Type header: Axios/browser sets the multipart boundary
    return api
      .post("/documents/upload", form, {
        onUploadProgress: (e) => {
          if (e.total) onProgress?.(Math.round((e.loaded * 100) / e.total));
        },
      })
      .then((r) => r.data);
  },

  // Spelling matches the backend route exactly
  retryEmbedding: (id) =>
    api
      .post(`/documents/retry-embbeding/${encodeURIComponent(id)}`)
      .then((r) => r.data),
};