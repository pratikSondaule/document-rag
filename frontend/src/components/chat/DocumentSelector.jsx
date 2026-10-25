import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Search } from "lucide-react";
import Button from "../common/Button";
import LoadingSpinner from "../common/LoadingSpinner";
import Modal from "../common/Modal";
import DocumentStatus from "../documents/DocumentStatus";

const reasonFor = (status) =>
  status === "pending"
    ? "Still processing"
    : status === "failed"
      ? "Embedding failed — retry from Documents"
      : status !== "ready"
        ? "Not available"
        : null;

export default function DocumentSelector({
  open,
  onClose,
  documents,
  loading,
  error,
  selectedIds,
  onChange,
}) {
  const [query, setQuery] = useState("");
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const readyCount = documents.filter((d) => d.status === "ready").length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? documents.filter((d) => d.name.toLowerCase().includes(q))
      : documents;
  }, [documents, query]);

  const toggle = (id) =>
    onChange(
      selected.has(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Choose documents"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>{selectedIds.length} selected</span>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                Clear
              </button>
            )}
          </div>
          <Button onClick={onClose}>Done</Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-center py-8 text-indigo-600">
          <LoadingSpinner className="size-5" />
        </div>
      ) : error ? (
        <p className="py-6 text-center text-sm text-slate-500">{error}</p>
      ) : documents.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-slate-600">
            You haven't uploaded any documents yet.
          </p>
          <Link
            to="/app/documents"
            onClick={onClose}
            className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Go to Documents
          </Link>
        </div>
      ) : (
        <>
          {readyCount === 0 && (
            <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              No documents are ready yet.{" "}
              <Link
                to="/app/documents"
                onClick={onClose}
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                Check the Documents page
              </Link>
              .
            </p>
          )}

          {documents.length > 6 && (
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documents"
                aria-label="Search documents"
                className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-base placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:text-sm"
              />
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No matching documents.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((doc) => {
                const disabled = doc.status !== "ready";
                const reason = reasonFor(doc.status);
                return (
                  <li key={doc.id}>
                    <label
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                        disabled
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="size-4 rounded border-slate-300 accent-indigo-600"
                        checked={selected.has(doc.id)}
                        disabled={disabled}
                        onChange={() => toggle(doc.id)}
                      />
                      <FileText
                        className="size-4 shrink-0 text-slate-400"
                        strokeWidth={1.75}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {doc.name}
                        </p>
                        {reason && (
                          <p className="text-xs text-slate-500">{reason}</p>
                        )}
                      </div>
                      <DocumentStatus status={doc.status} />
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </Modal>
  );
}
