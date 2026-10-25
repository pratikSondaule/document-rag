import { useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";
import Button from "../common/Button";
import LoadingSpinner from "../common/LoadingSpinner";
import ChatMessage from "./ChatMessage";

export default function ChatMessages({
  messages,
  loading,
  error,
  onReload,
  sending,
  onRetryMessage,
  emptyState,
}) {
  const endRef = useRef(null);
  const prevLen = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const bigJump = Math.abs(messages.length - prevLen.current) > 1;
    prevLen.current = messages.length;
    endRef.current?.scrollIntoView({
      behavior: reduce || bigJump ? "auto" : "smooth",
      block: "end",
    });
  }, [messages.length, sending]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 py-6">
        {loading ? (
          <div className="flex flex-1 items-center justify-center text-indigo-600">
            <LoadingSpinner className="size-6" />
          </div>
        ) : error ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <AlertCircle className="size-5 text-red-500" />
            <p className="mt-2 text-sm text-slate-600">{error}</p>
            <Button variant="secondary" className="mt-4" onClick={onReload}>
              Try again
            </Button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            {emptyState ?? (
              <p className="text-sm text-slate-400">
                This conversation has no messages.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((m) => (
              <ChatMessage
                key={m.id}
                message={m}
                onRetry={onRetryMessage}
                retryDisabled={sending}
              />
            ))}
            {sending && (
              <div className="flex items-center gap-3" role="status">
                <span className="sr-only">Generating answer</span>
                <div className="grid size-7 shrink-0 place-items-center rounded-full bg-indigo-100">
                  <span className="flex gap-0.5" aria-hidden="true">
                    {[0, 150, 300].map((d) => (
                      <span
                        key={d}
                        className="size-1 animate-pulse rounded-full bg-indigo-500 motion-reduce:animate-none"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
