import { Sparkles } from "lucide-react";
import MarkdownContent from "./MarkdownContent";
import SourceReferences from "./SourceReferences";

export default function ChatMessage({ message, onRetry, retryDisabled }) {
  if (message.role === "user") {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-slate-100 px-4 py-2.5 text-sm text-slate-900">
          {message.content}
        </div>
        {message.status === "failed" && (
          <div
            role="alert"
            className="flex items-center gap-2 text-xs text-red-600"
          >
            <span>{message.error}</span>
            <button
              type="button"
              disabled={retryDisabled}
              onClick={() => onRetry(message.id)}
              className="font-medium underline underline-offset-2 hover:text-red-700 disabled:opacity-50"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-indigo-600 text-white">
        <Sparkles className="size-3.5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        {message.content ? (
          <MarkdownContent>{message.content}</MarkdownContent>
        ) : (
          <p className="text-sm italic text-slate-400">
            No answer was returned.
          </p>
        )}
        <SourceReferences sources={message.sources} />
      </div>
    </div>
  );
}
