import { useEffect } from "react";
import { ArrowUp, Files } from "lucide-react";
import LoadingSpinner from "../common/LoadingSpinner";
import SelectedDocumentChips from "./SelectedDocumentChips";

export default function ChatComposer({
  value,
  onChange,
  onSubmit,
  sending,
  selectedDocs,
  onOpenPicker,
  onRemoveDoc,
  onClearDocs,
  error,
  inputRef,
}) {
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value, inputRef]);

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSubmit();
    }
  };

  const hasDocs = selectedDocs.length > 0;

  return (
    <div className="relative shrink-0 bg-slate-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1">
      {/* Fade so messages dissolve behind the composer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-6 h-6"
        style={{
          background:
            "linear-gradient(to top, rgb(248 250 252), rgb(248 250 252 / 0))",
        }}
      />

      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.06)] transition-shadow focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50 motion-reduce:transition-none">
          {hasDocs && (
            <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
              <SelectedDocumentChips
                docs={selectedDocs}
                onRemove={onRemoveDoc}
              />
              <button
                type="button"
                onClick={onClearDocs}
                className="text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                Clear
              </button>
            </div>
          )}

          <textarea
            ref={inputRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={sending}
            aria-label="Ask a question"
            placeholder="Ask a question about your documents"
            className="block max-h-[200px] w-full resize-none bg-transparent px-5 pb-1 pt-4 text-base outline-none placeholder:text-slate-400 disabled:opacity-60 sm:text-sm"
          />

          <div className="flex items-center justify-between px-3 pb-3 pt-1">
            <button
              type="button"
              onClick={onOpenPicker}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-indigo-600 motion-reduce:transition-none ${
                hasDocs
                  ? "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              }`}
            >
              <Files className="size-3.5" />
              {hasDocs ? `${selectedDocs.length} selected` : "Select documents"}
            </button>

            <button
              type="button"
              onClick={onSubmit}
              disabled={sending || !value.trim()}
              aria-label="Send message"
              className="grid size-9 place-items-center rounded-full bg-indigo-600 text-white transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 motion-reduce:transition-none"
            >
              {sending ? (
                <LoadingSpinner className="size-4" />
              ) : (
                <ArrowUp className="size-4" />
              )}
            </button>
          </div>
        </div>

        {error ? (
          <p role="alert" className="mt-2 px-2 text-xs text-red-600">
            {error}
          </p>
        ) : (
          <p className="mt-2 text-center text-xs text-slate-400">
            Answers are generated from your selected PDFs.
          </p>
        )}
      </div>
    </div>
  );
}
