import { useCallback, useEffect, useRef, useState } from "react";
import { chatsApi } from "../api/chats.api";
import { getErrorMessage } from "../utils/apiErrors";

export function useChat({ sessionId, resetKey, onSessionCreated, onActivity, onDocumentsRestored }) {
  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [sending, setSending] = useState(false);

  // Bumped on every session switch; stale async results are ignored
  const versionRef = useRef(0);
  // Session we just created locally: its messages are already on screen
  const skipLoadRef = useRef(null);
  const cbRef = useRef({});
  useEffect(() => {
    cbRef.current = { onSessionCreated, onActivity, onDocumentsRestored };
  });

  const loadHistory = useCallback(async (id) => {
    const version = versionRef.current;
    setLoadingHistory(true);
    setHistoryError("");
    setMessages([]);
    try {
      const h = await chatsApi.getHistory(id);
      if (version !== versionRef.current) return;
      setMessages(h.messages);
      cbRef.current.onDocumentsRestored?.(h.documentIds ?? []);
    } catch (err) {
      if (version !== versionRef.current) return;
      setHistoryError(getErrorMessage(err, "Could not load this conversation."));
    } finally {
      if (version === versionRef.current) setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    versionRef.current += 1;
    setSending(false);
    setHistoryError("");

    if (!sessionId) {
      setMessages([]);
      setLoadingHistory(false);
      return;
    }
    if (skipLoadRef.current === sessionId) {
      skipLoadRef.current = null;
      return;
    }
    loadHistory(sessionId);
  }, [sessionId, resetKey, loadHistory]);

  const dispatch = useCallback(
    async (userMsg) => {
      const version = versionRef.current;
      try {
        const res = await chatsApi.ask({
          question: userMsg.content,
          sessionId,
          documentIds: userMsg.documentIds,
        });
        if (version !== versionRef.current) {
          cbRef.current.onActivity?.(); // user moved on; server still saved it
          return;
        }
        setMessages((list) =>
          list
            .map((m) => (m.id === userMsg.id ? { ...m, status: "sent" } : m))
            .concat({
              id: `a-${Date.now()}`,
              role: "assistant",
              content: res.answer,
              sources: res.sources,
            })
        );
        setSending(false);
        if (!sessionId && res.sessionId) {
          skipLoadRef.current = res.sessionId;
          cbRef.current.onSessionCreated?.(res.sessionId);
        } else {
          cbRef.current.onActivity?.();
        }
      } catch (err) {
        if (version !== versionRef.current) return;
        setMessages((list) =>
          list.map((m) =>
            m.id === userMsg.id
              ? { ...m, status: "failed", error: getErrorMessage(err, "Could not get an answer.") }
              : m
          )
        );
        setSending(false);
      }
    },
    [sessionId]
  );

  const send = useCallback(
    ({ question, documentIds }) => {
      if (sending) return;
      const userMsg = {
        id: `u-${Date.now()}`,
        role: "user",
        content: question,
        status: "sending",
        documentIds,
      };
      setMessages((list) => [...list, userMsg]);
      setSending(true);
      dispatch(userMsg);
    },
    [sending, dispatch]
  );

  // Only failed messages get a retry; the original text is resent as-is
  const retry = useCallback(
    (id) => {
      const msg = messages.find((m) => m.id === id);
      if (!msg || sending || msg.status !== "failed") return;
      setMessages((list) =>
        list.map((m) => (m.id === id ? { ...m, status: "sending", error: undefined } : m))
      );
      setSending(true);
      dispatch(msg);
    },
    [messages, sending, dispatch]
  );

  const reloadHistory = useCallback(() => {
    if (sessionId) loadHistory(sessionId);
  }, [sessionId, loadHistory]);

  return { messages, loadingHistory, historyError, sending, send, retry, reloadHistory };
}