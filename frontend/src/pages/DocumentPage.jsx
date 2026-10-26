import { useState } from "react";
import { AlertCircle, FileText } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../components/common/Button";
import ConfirmDialog from "../components/common/ConfirmDialog";
import EmptyState from "../components/common/EmptyState";
import LoadingSpinner from "../components/common/LoadingSpinner";
import DocumentList from "../components/documents/DocumentList";
import DocumentUploader from "../components/documents/DocumentUploader";
import { useDocuments } from "../hooks/useDocuments";
import { getErrorMessage } from "../utils/apiErrors";

export default function DocumentsPage() {
  const { documents, loading, error, refresh, retry, remove, retryingIds } =
    useDocuments({ poll: true });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (deleting || !deleteTarget) return;
    setDeleting(true);
    try {
      await remove(deleteTarget.id);
      toast.success("Document deleted.");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete document."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Documents</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload PDFs to chat with. Documents become available once processing
          finishes.
        </p>
      </header>

      <DocumentUploader onUploaded={() => refresh({ silent: true })} />

      <section className="mt-8" aria-live="polite">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Your documents{!loading && !error ? ` (${documents.length})` : ""}
        </h2>

        {loading ? (
          <div className="flex justify-center py-12 text-indigo-600">
            <LoadingSpinner className="size-6" />
          </div>
        ) : error ? (
          <EmptyState
            icon={AlertCircle}
            title="Couldn't load documents"
            description={error}
            action={
              <Button variant="secondary" onClick={() => refresh()}>
                Try again
              </Button>
            }
          />
        ) : documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description="Upload your first PDF above to start asking questions about it."
          />
        ) : (
          <DocumentList
            documents={documents}
            onRetry={retry}
            retryingIds={retryingIds}
            onDelete={setDeleteTarget}
          />
        )}
      </section>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete document?"
        description={`"${deleteTarget?.name ?? ""}" and its index will be permanently deleted.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
