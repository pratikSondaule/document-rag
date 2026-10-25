import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { chatsApi } from "../api/chats.api";
import { getErrorMessage } from "../utils/apiErrors";

export const SessionsContext = createContext(null);

export function SessionsProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      setSessions(await chatsApi.listSessions());
      setError("");
    } catch (err) {
      if (!silent)
        setError(getErrorMessage(err, "Could not load conversations."));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Both throw on failure so the calling dialog can show the error;
  // local state changes only after the backend succeeds.
  const rename = useCallback(async (id, title) => {
    await chatsApi.renameSession(id, title);
    setSessions((list) => list.map((s) => (s.id === id ? { ...s, title } : s)));
  }, []);

  const remove = useCallback(async (id) => {
    await chatsApi.deleteSession(id);
    setSessions((list) => list.filter((s) => s.id !== id));
  }, []);

  const value = useMemo(
    () => ({ sessions, loading, error, refresh, rename, remove }),
    [sessions, loading, error, refresh, rename, remove],
  );

  return (
    <SessionsContext.Provider value={value}>
      {children}
    </SessionsContext.Provider>
  );
}
