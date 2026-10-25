import { FileText, RotateCw } from "lucide-react";
import Button from "../common/Button";
import DocumentStatus from "./DocumentStatus";
import { formatDate } from "../../utils/formatDate";

export default function DocumentList({ documents, onRetry, retryingIds }) {
  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5"
        >
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
            <FileText className="size-4.5" strokeWidth={1.75} />
          </div>

          <div className="min-w-0 flex-1 basis-48">
            <p
              className="truncate text-sm font-medium text-slate-900"
              title={doc.name}
            >
              {doc.name}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Uploaded {formatDate(doc.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <DocumentStatus status={doc.status} />
            {doc.status === "failed" && (
              <Button
                variant="secondary"
                className="h-8 px-3"
                loading={retryingIds.has(doc.id)}
                onClick={() => onRetry(doc.id)}
              >
                {!retryingIds.has(doc.id) && <RotateCw className="size-3.5" />}
                Retry
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
