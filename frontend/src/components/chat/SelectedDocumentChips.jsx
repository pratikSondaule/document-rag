import { FileText, X } from "lucide-react";

export default function SelectedDocumentChips({ docs, onRemove }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Selected documents">
      {docs.map((d) => (
        <li
          key={d.id}
          className="inline-flex max-w-[12rem] items-center gap-1 rounded-md bg-indigo-50 py-1 pl-2 pr-1 text-xs text-indigo-700"
        >
          <FileText className="size-3 shrink-0" />
          <span className="truncate" title={d.name}>
            {d.name}
          </span>
          <button
            type="button"
            onClick={() => onRemove(d.id)}
            aria-label={`Remove ${d.name}`}
            className="rounded p-0.5 hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-indigo-600"
          >
            <X className="size-3" />
          </button>
        </li>
      ))}
    </ul>
  );
}
