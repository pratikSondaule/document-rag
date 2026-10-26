import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import toast from "react-hot-toast";
import ChatComposer from "../components/chat/ChatComposer";
import ChatHeader from "../components/chat/ChatHeader";
import ChatMessages from "../components/chat/ChatMessages";
import DocumentSelector from "../components/chat/DocumentSelector";
import Button from "../components/common/Button";
import { useChat } from "../hooks/useChat";
import { useDocuments } from "../hooks/useDocuments";
import { useSessions } from "../hooks/useSessions";
import { chatsApi } from "../api/chats.api";

const SUGGESTIONS = [
  "Summarize the selected document.",
  "What are the key takeaways?",
  "Explain the most important terms.",
  "What conclusions does the document reach?",
];

function EmptyChat({
  docsLoading,
  readyCount,
  selectedCount,
  onOpenPicker,
  onSuggest,
}) {
  return (
    <div className="w-full max-w-xl text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        What would you like to understand?
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Answers are generated using the PDFs you select.
      </p>

      {!docsLoading && (
        <div className="mt-5">
          {readyCount === 0 ? (
            <p className="text-sm text-slate-500">
              No documents are ready yet.{" "}
              <Link
                to="/app/documents"
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                Upload or check your documents
              </Link>
              .
            </p>
          ) : selectedCount === 0 ? (
            <Button variant="secondary" onClick={onOpenPicker}>
              Select documents to start
            </Button>
          ) : (
            <p className="text-sm text-slate-600">
              Searching {selectedCount} document{selectedCount === 1 ? "" : "s"}
              .
            </p>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSuggest(s)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50/40 focus-visible:outline-2 focus-visible:outline-indigo-600 motion-reduce:transition-none"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [params] = useSearchParams();
  const sessionId = params.get("session");
  const location = useLocation();
  const navigate = useNavigate();

  const { sessions, refresh: refreshSessions } = useSessions();
  const {
    documents,
    loading: docsLoading,
    error: docsError,
  } = useDocuments({ poll: true });

  const [selectedIds, setSelectedIds] = useState([]);
  const [draft, setDraft] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef(null);

  const readyDocs = useMemo(
    () => documents.filter((d) => d.status === "ready"),
    [documents],
  );

  // Only ready documents can ever be sent
  const selectedDocs = useMemo(() => {
    const byId = new Map(readyDocs.map((d) => [d.id, d]));
    return selectedIds.map((id) => byId.get(id)).filter(Boolean);
  }, [selectedIds, readyDocs]);
  const effectiveIds = useMemo(
    () => selectedDocs.map((d) => d.id),
    [selectedDocs],
  );

  const {
    messages,
    loadingHistory,
    historyError,
    sending,
    send,
    retry,
    reloadHistory,
  } = useChat({
    sessionId,
    resetKey: location.key,
    onSessionCreated: (id) => {
      navigate(`/app?session=${encodeURIComponent(id)}`, { replace: true });
      refreshSessions({ silent: true });
    },
    onActivity: () => refreshSessions({ silent: true }),
    onDocumentsRestored: setSelectedIds,
  });

  // "New chat" (or any switch to no session): fresh composer and selection
  useEffect(() => {
    if (!sessionId) {
      setSelectedIds([]);
      setDraft("");
    }
  }, [sessionId, location.key]);

  // Return focus to the composer after an answer (skip on touch devices)
  const wasSending = useRef(false);
  useEffect(() => {
    if (
      wasSending.current &&
      !sending &&
      window.matchMedia("(pointer: fine)").matches
    ) {
      inputRef.current?.focus({ preventScroll: true });
    }
    wasSending.current = sending;
  }, [sending]);

  const submit = () => {
    if (sending) return;
    const question = draft.trim();
    if (!question) return;
    if (effectiveIds.length === 0) {
      toast.error(
        readyDocs.length
          ? "Select at least one document."
          : "No documents are ready yet. Upload a PDF and wait for processing to finish.",
      );
      return;
    }
    setDraft("");
    send({ question, documentIds: effectiveIds });
  };

  const changeSelection = (ids) => {
    setSelectedIds(ids);
    if (sessionId) {
      chatsApi.updateSessionDocuments(sessionId, ids).catch(() => {});
    }
  };

  const activeTitle =
    sessions.find((s) => s.id === sessionId)?.title ?? "Conversation";

  return (
    <div className="absolute inset-0 flex flex-col">
      {sessionId && <ChatHeader title={activeTitle} />}

      <ChatMessages
        messages={messages}
        loading={loadingHistory}
        error={historyError}
        onReload={reloadHistory}
        sending={sending}
        onRetryMessage={retry}
        emptyState={
          sessionId ? null : (
            <EmptyChat
              docsLoading={docsLoading}
              readyCount={readyDocs.length}
              selectedCount={effectiveIds.length}
              onOpenPicker={() => setPickerOpen(true)}
              onSuggest={(text) => {
                setDraft(text);
                inputRef.current?.focus();
              }}
            />
          )
        }
      />

      <ChatComposer
        value={draft}
        onChange={setDraft}
        onSubmit={submit}
        sending={sending}
        selectedDocs={selectedDocs}
        onOpenPicker={() => setPickerOpen(true)}
        onRemoveDoc={(id) =>
          changeSelection(selectedIds.filter((x) => x !== id))
        }
        onClearDocs={() => changeSelection([])}
        inputRef={inputRef}
      />

      <DocumentSelector
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        documents={documents}
        loading={docsLoading}
        error={docsError}
        selectedIds={effectiveIds}
        onChange={changeSelection}
      />
    </div>
  );
}
