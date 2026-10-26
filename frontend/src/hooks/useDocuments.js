import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { documentsApi } from "../api/documents.api";
import { getErrorMessage } from "../utils/apiErrors";

const POLL_MS = 4000;

export function useDocuments({ poll = false } = {}) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryingIds, setRetryingIds] = useState(() => new Set());

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const docs = await documentsApi.list();
      setDocuments(docs);
      setError("");
    } catch (err) {
      if (!silent) setError(getErrorMessage(err, "Could not load documents."));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll only while something is processing; stops on unmount
  const hasPending = documents.some((d) => d.status === "pending");
  useEffect(() => {
    if (!poll || !hasPending) return;
    const id = setInterval(() => refresh({ silent: true }), POLL_MS);
    return () => clearInterval(id);
  }, [poll, hasPending, refresh]);

  const retry = useCallback(
    async (id) => {
      if (retryingIds.has(id)) return;
      setRetryingIds((s) => new Set(s).add(id));
      try {
        await documentsApi.retryEmbedding(id);
        toast.success("Embedding restarted.");
        await refresh({ silent: true });
      } catch (err) {
        toast.error(getErrorMessage(err, "Could not retry embedding."));
      } finally {
        setRetryingIds((s) => {
          const next = new Set(s);
          next.delete(id);
          return next;
        });
      }
    },
    [refresh, retryingIds]
  );

  const remove = useCallback(async (id) => {
    await documentsApi.delete(id);
    setDocuments((list) => list.filter((d) => d.id !== id));
  }, []);

  return {
    documents,
    loading,
    error,
    refresh,
    retry,
    remove,
    deleteDocument: remove,
    retryingIds,
  };
}