import { ChevronDown, FileText } from "lucide-react";

export default function SourceReferences({ sources }) {
  if (!sources?.length) return null;

  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        Sources
      </p>
      <ul className="space-y-1.5">
        {sources.map((s, i) => {
          const header = (
            <span className="flex min-w-0 items-center gap-2">
              <FileText className="size-3.5 shrink-0 text-slate-400" />
              <span className="truncate font-medium text-slate-700">
                {s.name ?? "Source"}
              </span>
              {s.page != null && (
                <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">
                  p. {s.page}
                </span>
              )}
            </span>
          );
          return (
            <li
              key={i}
              className="rounded-lg border border-slate-200 bg-white text-xs"
            >
              {s.snippet ? (
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2">
                    {header}
                    <ChevronDown className="size-3.5 shrink-0 text-slate-400 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
                  </summary>
                  <p className="whitespace-pre-wrap border-t border-slate-100 px-3 py-2 text-slate-600">
                    {s.snippet}
                  </p>
                </details>
              ) : (
                <div className="px-3 py-2">{header}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
